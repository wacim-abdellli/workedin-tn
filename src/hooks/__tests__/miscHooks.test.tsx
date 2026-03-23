import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));

import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { useAutosave } from '@/hooks/useAutosave';
import { useRouteFocus } from '@/hooks/useRouteFocus';
import { logger } from '@/lib/logger';

function RouterWrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={['/jobs']}>{children}</MemoryRouter>;
}

describe('misc hooks coverage', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('animates counters toward the target number', () => {
        let rafCallback: FrameRequestCallback | undefined;
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
            rafCallback = cb;
            return 1;
        });
        const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

        const { result, unmount } = renderHook(() => useAnimatedCounter(100, 1000));

        act(() => {
            rafCallback?.(0);
            rafCallback?.(500);
            rafCallback?.(1000);
            rafCallback?.(1500);
        });

        expect(result.current).toBe(100);
        unmount();
        expect(cancelSpy).toHaveBeenCalled();

        rafSpy.mockRestore();
        cancelSpy.mockRestore();
    });

    it('autosaves, loads, and clears persisted data', () => {
        const onSave = vi.fn();
        const storage = new Map<string, string>();
        vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => {
            storage.set(key, value);
        });
        vi.mocked(localStorage.getItem).mockImplementation((key: string) => storage.get(key) ?? null);
        vi.mocked(localStorage.removeItem).mockImplementation((key: string) => {
            storage.delete(key);
        });
        const { result } = renderHook(() =>
            useAutosave({
                data: { title: 'Hello' },
                storageKey: 'draft',
                onSave,
                interval: 100,
            })
        );

        act(() => {
            vi.advanceTimersByTime(100);
            vi.advanceTimersByTime(500);
            vi.advanceTimersByTime(2000);
        });

        expect(localStorage.setItem).toHaveBeenCalled();
        expect(onSave).toHaveBeenCalledWith({ title: 'Hello' });

        const loaded = result.current.loadFromStorage();
        expect(loaded?.data).toEqual({ title: 'Hello' });

        act(() => {
            result.current.clearStorage();
        });

        expect(localStorage.removeItem).toHaveBeenCalledWith('draft');
        expect(result.current.status).toBe('idle');
    });

    it('handles autosave storage failures', () => {
        vi.mocked(localStorage.setItem).mockImplementationOnce(() => {
            throw new Error('quota');
        });

        const { result } = renderHook(() =>
            useAutosave({
                data: { title: 'Hello' },
                storageKey: 'draft',
                interval: 100,
            })
        );

        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(logger.error).toHaveBeenCalled();
        expect(result.current.status).toBe('error');
    });

    it('moves focus to main content and then h1 on route changes', () => {
        document.body.innerHTML = '<main id="main-content" tabIndex="-1"></main>';
        const main = document.getElementById('main-content') as HTMLElement;
        const mainFocusSpy = vi.spyOn(main, 'focus');

        renderHook(() => useRouteFocus(), { wrapper: RouterWrapper });

        expect(mainFocusSpy).toHaveBeenCalled();
        expect(main.style.outline).toBe('none');

        document.body.innerHTML = '<h1>Page title</h1>';
        const heading = document.querySelector('h1') as HTMLHeadingElement;
        const headingFocusSpy = vi.spyOn(heading, 'focus');

        renderHook(() => useRouteFocus(), { wrapper: RouterWrapper });

        expect(headingFocusSpy).toHaveBeenCalled();
        expect(heading.tabIndex).toBe(-1);
        expect(heading.style.outline).toBe('none');
    });
});
