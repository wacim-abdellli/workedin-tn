// src/lib/validateEnv.ts
// Environment variable validation for production safety

interface RequiredEnv {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
}

// Optional VITE_ vars that are safe to expose in the client bundle.
// Payment (Flouci) and email (Resend) secrets are server-side only —
// they must be configured as Supabase Edge Function secrets via:
//   supabase secrets set FLOUCI_APP_TOKEN=... FLOUCI_APP_SECRET=... RESEND_API_KEY=...
// Never add client-side VITE_FLOUCI_* or VITE_RESEND_* variables.
interface OptionalEnv {
    VITE_GOOGLE_ANALYTICS_ID?: string;
    VITE_SENTRY_DSN?: string;
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

    if (missing.length > 0) {
        const errorMessage =
            `Missing required environment variables:\n${missing.join('\n')}\n\n` +
            `Please create a .env.local file with these variables.`;

        // In production, throw error to prevent app from starting
        if (import.meta.env.MODE === 'production') {
            throw new Error(errorMessage);
        }

        // In development, log warning
        console.warn('⚠️ ' + errorMessage);
    }

    return required;
}

// Get optional client-safe env vars safely.
export function getOptionalEnv(): OptionalEnv {
    return {
        VITE_GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
        VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    };
}

// Validate on module load in production
if (import.meta.env.MODE === 'production') {
    validateEnv();
}
