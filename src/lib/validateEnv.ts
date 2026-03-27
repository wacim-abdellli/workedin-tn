// src/lib/validateEnv.ts
// Environment variable validation for production safety

interface RequiredEnv {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
}

interface OptionalEnv {
    VITE_FLOUCI_APP_TOKEN?: string;
    VITE_GOOGLE_ANALYTICS_ID?: string;
    VITE_SENTRY_DSN?: string;
    VITE_POSTHOG_KEY?: string;
    VITE_POSTHOG_HOST?: string;
    VITE_ADMIN_EMAILS?: string;
}

export type AppEnv = RequiredEnv & OptionalEnv;

export function validateEnv(): RequiredEnv {
    const required: RequiredEnv = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };

    const missing: string[] = [];

    Object.entries(required).forEach(([key, value]) => {
        if (!value) {
            missing.push(key);
        }
    });

    // CRITICAL SECURITY CHECK: Ensure service role key is NEVER in frontend
    if (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
            '🚨 SECURITY VIOLATION: VITE_SUPABASE_SERVICE_ROLE_KEY detected in frontend!\n\n' +
            'Service role keys bypass ALL security rules and must NEVER be exposed to browsers.\n' +
            'Remove it from .env immediately and use it ONLY in:\n' +
            '1. Supabase Edge Functions (via: supabase secrets set)\n' +
            '2. Server-side code (never frontend)\n\n' +
            'This key gives FULL database access to anyone who inspects your frontend code!'
        );
    }

    // Warn about other secrets that shouldn't be in frontend
    if (import.meta.env.VITE_FLOUCI_APP_SECRET) {
        console.error(
            '⚠️ SECURITY WARNING: VITE_FLOUCI_APP_SECRET should NOT be in frontend!\n' +
            'Move it to Supabase Edge Functions: supabase secrets set FLOUCI_APP_SECRET=xxx'
        );
    }

    if (missing.length > 0) {
        const errorMessage =
            `Missing required environment variables:\n${missing.join('\n')}\n\n` +
            `Please create a .env file with these variables.`;

        // In production, throw error to prevent app from starting
        if (import.meta.env.MODE === 'production') {
            throw new Error(errorMessage);
        }

        // In development, log warning
        console.warn('⚠️ ' + errorMessage);
    }

    return required;
}

// Get optional env vars safely
export function getOptionalEnv(): OptionalEnv {
    return {
        VITE_FLOUCI_APP_TOKEN: import.meta.env.VITE_FLOUCI_APP_TOKEN,
        VITE_GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
        VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
        VITE_POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY,
        VITE_POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST,
        VITE_ADMIN_EMAILS: import.meta.env.VITE_ADMIN_EMAILS,
    };
}

// Validate on module load in production
if (import.meta.env.MODE === 'production') {
    validateEnv();
}
