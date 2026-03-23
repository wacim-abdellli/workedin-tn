import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProfilePath } from '@/lib/accountMode';
import Loading from '../ui/Loading';

export function ProfileRedirect() {
    const { user, profile, activeMode, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        navigate(getProfilePath(profile, activeMode), { replace: true });
    }, [activeMode, user, profile, isLoading, navigate]);

    return <Loading fullScreen />;
}
