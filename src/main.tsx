import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics } from './lib/analytics'
import { initSentry } from './lib/sentry'
import { validateEnv } from './lib/validateEnv'

// Validate environment variables
validateEnv()

// Initialize Analytics
initAnalytics()

// Initialize Sentry for production error tracking
initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
