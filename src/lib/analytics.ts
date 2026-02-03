import posthog from 'posthog-js'

// ============================================
// ANALYTICS TYPES
// ============================================

export interface AnalyticsProperties {
    [key: string]: string | number | boolean | null | undefined;
}

export const initAnalytics = () => {
    if (import.meta.env.PROD) {
        posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
            api_host: 'https://app.posthog.com',
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

