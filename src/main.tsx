import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { validateEnv } from './lib/validateEnv'

// Validate environment variables
validateEnv()

// Defer observability tooling to separate chunks and load it only in production.
if (import.meta.env.PROD) {
  void import('./lib/analytics').then(({ initAnalytics }) => {
    initAnalytics()
  })

  void import('./lib/sentry').then(({ initSentry, Sentry }) => {
    // Initialize Sentry
    initSentry();
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason, {
        contexts: {
          unhandledRejection: {
            promise: String(event.promise),
          },
        },
      });
    });
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
