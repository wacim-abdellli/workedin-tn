import posthog from 'posthog-js'

// ============================================
// ANALYTICS TYPES
// ============================================

export interface AnalyticsProperties {
    [key: string]: string | number | boolean | null | undefined;
}

export const initAnalytics = () => {
    const key = import.meta.env.VITE_POSTHOG_KEY;
    const host = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
    if (import.meta.env.PROD && key) {
        posthog.init(key, {
            api_host: host,
        })
    }
}

export const trackEvent = (event: string, properties?: AnalyticsProperties) => {
    posthog.capture(event, properties)
}

// Track page views
export const trackPageView = () => {
    posthog.capture('$pageview')
}

