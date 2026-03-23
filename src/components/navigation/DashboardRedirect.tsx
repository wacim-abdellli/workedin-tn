import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPath, getOnboardingPath, isModeOnboarded } from '@/lib/accountMode';

export const DashboardRedirect = () => {
    const { profile, freelancerProfile, activeMode, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    if (!profile.user_type) {
        return <Navigate to="/signup?step=select-type" replace />;
    }

    return (
        <Navigate
            to={isModeOnboarded(profile, freelancerProfile, activeMode)
                ? getDashboardPath(activeMode)
                : getOnboardingPath(activeMode)}
            replace
        />
    );
};
