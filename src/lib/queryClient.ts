/**
 * React Query client configuration
 */
import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

// Lazy import Sentry to avoid circular dependencies
let Sentry: typeof import('@/lib/sentry').Sentry | null = null;
if (import.meta.env.PROD) {
    import('@/lib/sentry').then((module) => {
        Sentry = module.Sentry;
    });
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 2 * 60_000,   // Data is fresh for 2 minutes
            gcTime: 30 * 60_000,     // Cache for 30 minutes
            retry: 2,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
            onError: (error) => {
                // Log error locally
                logger.error('Mutation error:', error);
                
                // Send to Sentry in production
                if (import.meta.env.PROD && Sentry) {
                    Sentry.captureException(error);
                }
            },
        },
    },
});
