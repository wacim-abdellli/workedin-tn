/**
 * React Query client configuration
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,      // Data is fresh for 30s
            gcTime: 5 * 60_000,     // Cache for 5 minutes (was cacheTime)
            retry: 2,               // Retry failed requests twice
            refetchOnWindowFocus: false, // Don't refetch on tab focus
        },
        mutations: {
            retry: 1,
        },
    },
});
