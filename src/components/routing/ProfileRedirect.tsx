import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../ui/Loading';

export function ProfileRedirect() {
    const { user, profile, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        if (profile?.user_type === 'freelancer') {
            // Get username or use id
            const identifier = profile.username || profile.id;
            navigate(`/freelancer/${identifier}`, { replace: true });
        } else if (profile?.user_type === 'client') {
            // Check if client has a username/public profile (future proofing), 
            // otherwise /client/dashboard is standard
            navigate('/client/dashboard', { replace: true });
        } else {
            // Fallback for 'both' or undefined, usually freelancer dashboard or role selection
            navigate('/freelancer/dashboard', { replace: true });
        }
    }, [user, profile, isLoading, navigate]);

    return <Loading fullScreen />;
}
