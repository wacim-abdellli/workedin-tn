import { describe, expect, it } from 'vitest';

vi.mock('@/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { queryClient } from '../queryClient';

describe('query client defaults', () => {
    it('disables global focus refetch churn while keeping caches warm', () => {
        const defaults = queryClient.getDefaultOptions();

        expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
        expect(defaults.queries?.staleTime).toBe(30_000);
        expect(defaults.queries?.gcTime).toBe(5 * 60_000);
        expect(defaults.queries?.retry).toBe(2);
    });

    it('configures mutation retry count', () => {
        const defaults = queryClient.getDefaultOptions();
        expect(defaults.mutations?.retry).toBe(1);
    });

    it('has mutation onError handler', () => {
        const defaults = queryClient.getDefaultOptions();
        expect(typeof defaults.mutations?.onError).toBe('function');
    });

    it('client is an instance of QueryClient', () => {
        expect(queryClient).toBeDefined();
        expect(typeof queryClient.getDefaultOptions).toBe('function');
    });
});
