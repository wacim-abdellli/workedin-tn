import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should debounce value updates', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        // Initial value
        expect(result.current).toBe('initial');

        // Update value
        rerender({ value: 'updated', delay: 500 });

        // Value should still be initial before delay
        expect(result.current).toBe('initial');

        // Fast forward time
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Now value should be updated
        expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'a', delay: 300 } }
        );

        expect(result.current).toBe('a');

        // Rapid updates
        rerender({ value: 'b', delay: 300 });
        act(() => {
            vi.advanceTimersByTime(100);
        });

        rerender({ value: 'c', delay: 300 });
        act(() => {
            vi.advanceTimersByTime(100);
        });

        rerender({ value: 'd', delay: 300 });
        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Still should be 'a' as timer keeps resetting
        expect(result.current).toBe('a');

        // Wait for full delay
        act(() => {
            vi.advanceTimersByTime(300);
        });

        // Should be final value
        expect(result.current).toBe('d');
    });

    it('should work with different types', () => {
        // Number
        const { result: numberResult } = renderHook(() => useDebounce(42, 100));
        expect(numberResult.current).toBe(42);

        // Object
        const obj = { key: 'value' };
        const { result: objectResult } = renderHook(() => useDebounce(obj, 100));
        expect(objectResult.current).toEqual(obj);

        // Array
        const arr = [1, 2, 3];
        const { result: arrayResult } = renderHook(() => useDebounce(arr, 100));
        expect(arrayResult.current).toEqual(arr);

        // Boolean
        const { result: boolResult } = renderHook(() => useDebounce(true, 100));
        expect(boolResult.current).toBe(true);
    });

    it('should cleanup timeout on unmount', () => {
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

        const { unmount } = renderHook(() => useDebounce('test', 500));

        unmount();

        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
    });

    it('should handle delay changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'test', delay: 500 } }
        );

        // Change delay
        rerender({ value: 'test2', delay: 100 });

        // Wait for shorter delay
        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(result.current).toBe('test2');
    });
});
