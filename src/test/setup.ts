import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Cleanup after each test case
afterEach(() => {
    cleanup();
});

// Mock window.matchMedia for components that use media queries
beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });

    // Mock IntersectionObserver — use regular function (not arrow) so it works as a constructor with `new`
    window.IntersectionObserver = vi.fn().mockImplementation(function MockIntersectionObserver() {
        return {
            observe: () => null,
            unobserve: () => null,
            disconnect: () => null,
        };
    }) as unknown as typeof IntersectionObserver;

    // Mock ResizeObserver
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    }));

    // Mock scrollTo
    window.scrollTo = vi.fn();

    // Mock localStorage
    const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
    });
});

// Clean up all mocks after all tests
afterAll(() => {
    vi.clearAllMocks();
});

// Suppress console errors during tests (optional - comment out for debugging)
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
