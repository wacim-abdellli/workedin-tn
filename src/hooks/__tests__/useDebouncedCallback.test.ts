import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

describe('useDebouncedCallback', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('delays callback execution by the specified delay', () => {
        vi.useFakeTimers();
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 300));

        act(() => {
            result.current('hello');
        });

        expect(callback).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(callback).toHaveBeenCalledWith('hello');
        expect(callback).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('cancels previous call when invoked again before delay', () => {
        vi.useFakeTimers();
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 300));

        act(() => {
            result.current('first');
        });

        act(() => {
            vi.advanceTimersByTime(100);
        });

        act(() => {
            result.current('second');
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(callback).not.toHaveBeenCalledWith('first');
        expect(callback).toHaveBeenCalledWith('second');
        expect(callback).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('passes all arguments to the callback', () => {
        vi.useFakeTimers();
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 100));

        act(() => {
            result.current('a', 'b', 'c');
        });

        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(callback).toHaveBeenCalledWith('a', 'b', 'c');
        vi.useRealTimers();
    });

    it('calls callback multiple times for separate debounce cycles', () => {
        vi.useFakeTimers();
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 200));

        act(() => {
            result.current('first');
        });

        act(() => {
            vi.advanceTimersByTime(200);
        });

        act(() => {
            result.current('second');
        });

        act(() => {
            vi.advanceTimersByTime(200);
        });

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, 'first');
        expect(callback).toHaveBeenNthCalledWith(2, 'second');
        vi.useRealTimers();
    });
});
