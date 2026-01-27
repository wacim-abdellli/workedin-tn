import posthog from 'posthog-js'

export const initAnalytics = () => {
    if (import.meta.env.PROD) {
        posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
            api_host: 'https://app.posthog.com',
        })
    }
}

export const trackEvent = (event: string, properties?: any) => {
    posthog.capture(event, properties)
}

// Track page views
export const trackPageView = () => {
    posthog.capture('$pageview')
}
