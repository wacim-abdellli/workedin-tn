// src/lib/sentry.ts
// Production error monitoring with Sentry

import * as Sentry from '@sentry/react';
import { getOptionalEnv } from './validateEnv';

let isInitialized = false;

export function initSentry(): void {
    if (isInitialized) return;

    const { VITE_SENTRY_DSN } = getOptionalEnv();

    if (import.meta.env.MODE === 'production' && VITE_SENTRY_DSN) {
        Sentry.init({
            dsn: VITE_SENTRY_DSN,
            environment: import.meta.env.MODE,
            tracesSampleRate: 1.0,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration({
                    maskAllText: true,
                    blockAllMedia: true,
                }),
            ],
            replaysSessionSampleRate: 1.0,
            replaysOnErrorSampleRate: 1.0,
        });

        isInitialized = true;
    }
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
    if (import.meta.env.MODE === 'production' && isInitialized) {
        Sentry.captureException(error, {
            contexts: {
                custom: context,
            },
        });
    }
}

export { Sentry };
