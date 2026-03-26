import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../useMediaQuery';

describe('useMediaQuery', () => {
    let matchMediaMock: ReturnType<typeof vi.fn>;
    let addEventListenerMock: ReturnType<typeof vi.fn>;
    let removeEventListenerMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        addEventListenerMock = vi.fn();
        removeEventListenerMock = vi.fn();

        matchMediaMock = vi.fn((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: addEventListenerMock,
            removeEventListener: removeEventListenerMock,
            dispatchEvent: vi.fn(),
        }));

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: matchMediaMock,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should return false initially when media query does not match', () => {
        const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
        expect(result.current).toBe(false);
    });

    it('should return true when media query matches', () => {
        matchMediaMock.mockImplementation((query: string) => ({
            matches: true,
            media: query,
            addEventListener: addEventListenerMock,
            removeEventListener: removeEventListenerMock,
        }));

        const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
        expect(result.current).toBe(true);
    });

    it('should add event listener on mount', () => {
        renderHook(() => useMediaQuery('(min-width: 768px)'));
        expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove event listener on unmount', () => {
        const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
        unmount();
        expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update when media query result changes', () => {
        let changeListener: (() => void) | null = null;

        matchMediaMock.mockImplementation((query: string) => ({
            matches: false,
            media: query,
            addEventListener: (_event: string, listener: () => void) => {
                changeListener = listener;
            },
            removeEventListener: vi.fn(),
        }));

        const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
        expect(result.current).toBe(false);

        // Simulate media query change
        matchMediaMock.mockImplementation((query: string) => ({
            matches: true,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));

        if (changeListener) {
            act(() => {
                changeListener!();
            });
        }
    });

    it('should handle different queries', () => {
        matchMediaMock.mockImplementation((query: string) => ({
            matches: query === '(max-width: 480px)',
            media: query,
            addEventListener: addEventListenerMock,
            removeEventListener: removeEventListenerMock,
        }));

        const { result: mobileResult } = renderHook(() => useMediaQuery('(max-width: 480px)'));
        expect(mobileResult.current).toBe(true);

        const { result: desktopResult } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
        expect(desktopResult.current).toBe(false);
    });

    it('should handle query changes', () => {
        matchMediaMock.mockImplementation((query: string) => ({
            matches: query === '(min-width: 768px)',
            media: query,
            addEventListener: addEventListenerMock,
            removeEventListener: removeEventListenerMock,
        }));

        const { result, rerender } = renderHook(
            ({ query }) => useMediaQuery(query),
            { initialProps: { query: '(min-width: 768px)' } }
        );

        expect(result.current).toBe(true);

        // Change query
        rerender({ query: '(min-width: 1024px)' });

        // Should re-evaluate with new query
        expect(removeEventListenerMock).toHaveBeenCalled();
        expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 1024px)');
    });

    it('should work with common breakpoints', () => {
        const breakpoints = {
            mobile: '(max-width: 639px)',
            tablet: '(min-width: 640px) and (max-width: 1023px)',
            desktop: '(min-width: 1024px)',
            dark: '(prefers-color-scheme: dark)',
            reducedMotion: '(prefers-reduced-motion: reduce)',
        };

        Object.entries(breakpoints).forEach(([, query]) => {
            const { result } = renderHook(() => useMediaQuery(query));
            expect(typeof result.current).toBe('boolean');
        });
    });
});
