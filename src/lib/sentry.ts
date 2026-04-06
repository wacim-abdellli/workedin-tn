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
