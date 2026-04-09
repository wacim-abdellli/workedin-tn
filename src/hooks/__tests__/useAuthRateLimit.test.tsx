import { renderHook, act } from '@testing-library/react';
import { useAuthRateLimit } from '../useAuthRateLimit';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('useAuthRateLimit', () => {
    let store: Record<string, string> = {};

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => store[key] ?? null,
            setItem: (key: string, value: string) => { store[key] = value.toString(); },
            removeItem: (key: string) => { delete store[key]; },
            clear: () => { store = {}; }
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should initialize with no lockout', () => {
        const { result } = renderHook(() => useAuthRateLimit('login'));
        expect(result.current.isLockedOut).toBe(false);
    });

    it('should handle failed attempts and trigger lockout', async () => {
        const { result } = renderHook(() => useAuthRateLimit('login'));
        
        const failingAction = () => Promise.reject(new Error('fail'));

        // 4 failed attempts
        for (let i = 0; i < 4; i++) {
            await act(async () => {
                await expect(result.current.recordAttempt(failingAction)).rejects.toThrow('fail');
            });
        }
        expect(result.current.isLockedOut).toBe(false);

        // 5th attempt locks it out
        await act(async () => {
            await expect(result.current.recordAttempt(failingAction)).rejects.toThrow(/Too many attempts/);
        });

        expect(result.current.isLockedOut).toBe(true);

        // Submitting while locked out
        await act(async () => {
            await expect(result.current.recordAttempt(failingAction)).rejects.toThrow(/Too many attempts/);
        });
    });

    it('should clear limits on success', async () => {
        const { result } = renderHook(() => useAuthRateLimit('login'));
        
        const failingAction = () => Promise.reject(new Error('fail'));
        const successAction = () => Promise.resolve('ok');

        await act(async () => {
            await expect(result.current.recordAttempt(failingAction)).rejects.toThrow('fail');
        });

        expect(localStorage.getItem('khedma_auth_attempts_login')).toBe('1');

        await act(async () => {
            await expect(result.current.recordAttempt(successAction)).resolves.toBe('ok');
        });

        expect(localStorage.getItem('khedma_auth_attempts_login')).toBeNull();
    });
});

