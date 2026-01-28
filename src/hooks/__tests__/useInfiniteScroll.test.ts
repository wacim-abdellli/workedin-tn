import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInfiniteScroll } from '../useInfiniteScroll';

// Mock react-intersection-observer
vi.mock('react-intersection-observer', () => ({
    useInView: vi.fn(() => ({
        ref: vi.fn(),
        inView: false,
    })),
}));

import { useInView } from 'react-intersection-observer';

describe('useInfiniteScroll', () => {
    const mockUseInView = useInView as ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseInView.mockReturnValue({
            ref: vi.fn(),
            inView: false,
        });
    });

    it('should return a ref function', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useInfiniteScroll(callback, true));

        expect(result.current).toBeDefined();
        expect(typeof result.current).toBe('function');
    });

    it('should not call callback when not in view', () => {
        const callback = vi.fn();
        mockUseInView.mockReturnValue({
            ref: vi.fn(),
            inView: false,
        });

        renderHook(() => useInfiniteScroll(callback, true));

        expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback when in view and hasMore is true', () => {
        const callback = vi.fn();
        mockUseInView.mockReturnValue({
            ref: vi.fn(),
            inView: true,
        });

        renderHook(() => useInfiniteScroll(callback, true));

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback when in view but hasMore is false', () => {
        const callback = vi.fn();
        mockUseInView.mockReturnValue({
            ref: vi.fn(),
            inView: true,
        });

        renderHook(() => useInfiniteScroll(callback, false));

        expect(callback).not.toHaveBeenCalled();
    });

    it('should use correct threshold and rootMargin', () => {
        const callback = vi.fn();
        renderHook(() => useInfiniteScroll(callback, true));

        expect(mockUseInView).toHaveBeenCalledWith({
            threshold: 0,
            rootMargin: '100px',
        });
    });

    it('should call callback again when inView changes', () => {
        const callback = vi.fn();

        // Start not in view
        mockUseInView.mockReturnValue({
            ref: vi.fn(),
            inView: false,
        });

        const { rerender } = renderHook(() => useInfiniteScroll(callback, true));
        expect(callback).not.toHaveBeenCalled();

        // Now in view
        mockUseInView.mockReturnValue({
            ref: vi.fn(),
            inView: true,
        });

        rerender();
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback when hasMore changes to false', () => {
        const callback = vi.fn();
        mockUseInView.mockReturnValue({
            ref: vi.fn(),
            inView: true,
        });

        const { rerender } = renderHook(
            ({ hasMore }) => useInfiniteScroll(callback, hasMore),
            { initialProps: { hasMore: true } }
        );

        expect(callback).toHaveBeenCalledTimes(1);

        // hasMore becomes false
        rerender({ hasMore: false });

        // Should not call again
        expect(callback).toHaveBeenCalledTimes(1);
    });
});
