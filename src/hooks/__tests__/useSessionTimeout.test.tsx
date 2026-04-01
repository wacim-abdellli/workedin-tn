import { renderHook } from '@testing-library/react';
import { useSessionTimeout } from '../useSessionTimeout';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

vi.mock('../../contexts/AuthContext');
vi.mock('react-router-dom', () => ({ useNavigate: vi.fn() }));

describe('useSessionTimeout', () => {
    const mockSignOut = vi.fn().mockResolvedValue(true);
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' }, signOut: mockSignOut } as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('should set an initial timeout if user is logged in', async () => {
        renderHook(() => useSessionTimeout());
        
        vi.advanceTimersByTime(30 * 60 * 1000);
        
        expect(mockSignOut).toHaveBeenCalled();
        // flush promises
        await Promise.resolve();
        expect(mockNavigate).toHaveBeenCalledWith('/login?reason=timeout');
    });

    it('should reset timeout on user activity', () => {
        renderHook(() => useSessionTimeout());
        
        vi.advanceTimersByTime(29 * 60 * 1000);
        expect(mockSignOut).not.toHaveBeenCalled();

        document.dispatchEvent(new Event('mousemove'));

        vi.advanceTimersByTime(29 * 60 * 1000);
        expect(mockSignOut).not.toHaveBeenCalled();

        vi.advanceTimersByTime(2 * 60 * 1000);
        expect(mockSignOut).toHaveBeenCalled();
    });

    it('should not set timeout if user is null', () => {
        vi.mocked(useAuth).mockReturnValue({ user: null } as any);
        renderHook(() => useSessionTimeout());
        vi.advanceTimersByTime(30 * 60 * 1000);
        expect(mockSignOut).not.toHaveBeenCalled();
    });
});
