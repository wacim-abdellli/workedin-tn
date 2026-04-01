import { useState, useCallback } from 'react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function useAuthRateLimit(actionName: string) {
    const storageKey = `khedma_auth_lockout_${actionName}`;
    const attemptsKey = `khedma_auth_attempts_${actionName}`;

    const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
        const item = localStorage.getItem(storageKey);
        if (item) {
            const parsed = parseInt(item, 10);
            if (parsed > Date.now()) return parsed;
            localStorage.removeItem(storageKey);
        }
        return null;
    });

    const [attempts, setAttempts] = useState<number>(() => {
        const item = localStorage.getItem(attemptsKey);
        return item ? parseInt(item, 10) : 0;
    });

    const checkRateLimit = useCallback(() => {
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const minutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
            return `Too many attempts. Please try again in ${minutes} minutes.`;
        }
        return null;
    }, [lockoutUntil]);

    const recordAttempt = useCallback(async (action: () => Promise<any>) => {
        const rateLimitError = checkRateLimit();
        if (rateLimitError) throw new Error(rateLimitError);

        try {
            const result = await action();
            // Reset attempts on success
            setAttempts(0);
            localStorage.removeItem(attemptsKey);
            return result;
        } catch (error) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            localStorage.setItem(attemptsKey, newAttempts.toString());

            if (newAttempts >= MAX_ATTEMPTS) {
                const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
                setLockoutUntil(lockoutTime);
                localStorage.setItem(storageKey, lockoutTime.toString());
                localStorage.removeItem(attemptsKey);
                setAttempts(0);
                throw new Error(`Too many attempts. Please try again in 15 minutes.`);
            }
            throw error;
        }
    }, [attempts, checkRateLimit]);

    return { recordAttempt, isLockedOut: !!(lockoutUntil && Date.now() < lockoutUntil) };
}
