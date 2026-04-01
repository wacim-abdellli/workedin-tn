import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { validateEnv } from './lib/validateEnv'

// Validate environment variables
validateEnv()

// One-time cleanup: remove the stale persisted workspace key that was causing
// cross-user session bleed (user A's workspace overwriting user B's on reload).
// The workspace is now always derived from the authenticated user's DB profile.
try {
  localStorage.removeItem('khedma-workspace');
} catch {
  // Ignore if localStorage is unavailable (e.g. private mode restrictions)
}

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
