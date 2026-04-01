import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useSessionTimeout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        if (user) {
            timeoutRef.current = setTimeout(async () => {
                await signOut();
                navigate('/login?reason=timeout');
            }, TIMEOUT_MS);
        }
    };

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const handleActivity = () => {
            resetTimeout();
        };

        if (user) {
            resetTimeout();
            events.forEach(event => document.addEventListener(event, handleActivity));
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => document.removeEventListener(event, handleActivity));
        };
    }, [user, signOut, navigate]);
}
