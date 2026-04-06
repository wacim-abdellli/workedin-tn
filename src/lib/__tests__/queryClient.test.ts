import { describe, expect, it } from 'vitest';

import { queryClient } from '../queryClient';

describe('query client defaults', () => {
  it('disables global focus refetch churn while keeping caches warm', () => {
    const defaults = queryClient.getDefaultOptions();

    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.gcTime).toBe(5 * 60_000);
  });
});
