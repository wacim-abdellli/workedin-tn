import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../useCountdown';

describe('useCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns null for null target', () => {
        const { result } = renderHook(() => useCountdown(null));
        expect(result.current).toBeNull();
    });

    it('returns null for undefined target', () => {
        const { result } = renderHook(() => useCountdown(undefined));
        expect(result.current).toBeNull();
    });

    it('returns expired when target is in the past', () => {
        const past = new Date('2025-06-14T12:00:00Z').toISOString();
        const { result } = renderHook(() => useCountdown(past));
        expect(result.current).toEqual({ days: 0, hours: 0, minutes: 0, expired: true });
    });

    it('returns remaining time when target is in the future', () => {
        const future = new Date('2025-06-20T12:00:00Z').toISOString();
        const { result } = renderHook(() => useCountdown(future));
        expect(result.current).toEqual({ days: 5, hours: 0, minutes: 0, expired: false });
    });

    it('updates when interval fires', () => {
        const future = new Date('2025-06-15T13:00:00Z').toISOString();
        const { result } = renderHook(() => useCountdown(future));
        expect(result.current).toEqual({ days: 0, hours: 1, minutes: 0, expired: false });

        act(() => {
            vi.advanceTimersByTime(3600000);
        });

        expect(result.current).toEqual({ days: 0, hours: 0, minutes: 0, expired: true });
    });
});
