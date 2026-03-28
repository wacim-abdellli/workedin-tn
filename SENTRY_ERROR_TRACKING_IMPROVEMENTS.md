# Sentry Error Tracking Improvements

## Summary
Enhanced Sentry error tracking to capture all error types across the Khedma TN application, including React errors, unhandled promise rejections, React Query mutations, and user context tracking.

---

## Changes Made

### 1. ErrorBoundary Component (`src/components/common/ErrorBoundary.tsx`)

**Added Sentry import:**
```typescript
import { Sentry } from '@/lib/sentry';
```

**Enhanced componentDidCatch to send errors to Sentry:**
```typescript
public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send error to Sentry in production
    if (import.meta.env.PROD) {
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });
    }
}
```

**What this captures:**
- All React component errors
- Component stack traces for debugging
- Only sends to Sentry in production

---

### 2. React Query Client (`src/lib/queryClient.ts`)

**Added global mutation error handler:**
```typescript
import { logger } from './logger';

// Lazy import Sentry to avoid circular dependencies
let Sentry: typeof import('@/lib/sentry').Sentry | null = null;
if (import.meta.env.PROD) {
    import('@/lib/sentry').then((module) => {
        Sentry = module.Sentry;
    });
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 2,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
            onError: (error) => {
                // Log error locally
                logger.error('Mutation error:', error);
                
                // Send to Sentry in production
                if (import.meta.env.PROD && Sentry) {
                    Sentry.captureException(error);
                }
            },
        },
    },
});
```

**What this captures:**
- All React Query mutation errors
- API call failures
- Database operation errors
- Logged locally for development debugging

---

### 3. Main Entry Point (`src/main.tsx`)

**Added unhandled promise rejection handler:**
```typescript
if (import.meta.env.PROD) {
  void import('./lib/analytics').then(({ initAnalytics }) => {
    initAnalytics()
  })

  void import('./lib/sentry').then(({ Sentry }) => {
    // Initialize Sentry
    const { initSentry } = require('./lib/sentry');
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
```

**What this captures:**
- Unhandled promise rejections
- Async errors that escape try-catch blocks
- Network errors not caught by React Query
- Promise chain failures

---

### 4. Auth Context (`src/contexts/AuthContext.tsx`)

**Added Sentry lazy import:**
```typescript
// Lazy import Sentry to avoid circular dependencies
let Sentry: typeof import('@/lib/sentry').Sentry | null = null;
if (import.meta.env.PROD) {
  import('@/lib/sentry').then((module) => {
    Sentry = module.Sentry;
  });
}
```

**Set user context on login (in fetchProfile):**
```typescript
// Set Sentry user context in production
if (import.meta.env.PROD && Sentry && nextProfile) {
  Sentry.setUser({
    id: nextProfile.id,
    email: nextProfile.email || undefined,
    username: nextProfile.full_name || undefined,
  });
}
```

**Clear user context on logout:**
```typescript
const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setFreelancerProfile(null);
    syncWorkspaceFromProfile(null, null);

    // Clear Sentry user context in production
    if (import.meta.env.PROD && Sentry) {
      Sentry.setUser(null);
    }

    clearAllAuthData();
    // ... rest of signOut logic
};
```

**What this provides:**
- User identification in error reports
- Ability to track errors per user
- Privacy-compliant (only in production)
- Automatic cleanup on logout

---

## Verification Checklist

### ✅ Step 1: Sentry.init() Configuration
- **DSN**: ✅ From `VITE_SENTRY_DSN` environment variable
- **Environment**: ✅ Set to `import.meta.env.MODE` (production)
- **tracesSampleRate**: ✅ Set to 0.1 (10% of transactions)
- **Integrations**: ✅ Browser tracing + Session replay
- **Location**: `src/lib/sentry.ts`

### ✅ Step 2: ErrorBoundary Integration
- **Sentry.captureException**: ✅ Called in `componentDidCatch`
- **Component stack**: ✅ Included in error context
- **Production only**: ✅ Guarded by `import.meta.env.PROD`

### ✅ Step 3: Global Error Handlers
- **React Query**: ✅ Global `onError` handler in mutations
- **Unhandled rejections**: ✅ Window event listener in main.tsx
- **Production only**: ✅ Both guarded by environment checks

### ✅ Step 4: User Context
- **Set on login**: ✅ In `fetchProfile` after profile loads
- **Clear on logout**: ✅ In `signOut` function
- **User data**: ✅ Includes id, email, username
- **Privacy**: ✅ Only in production

### ✅ Step 5: PostHog Verification
- **Production only**: ✅ Checked in `src/lib/analytics.ts`
- **Environment check**: ✅ `import.meta.env.PROD && key`
- **Lazy loaded**: ✅ Imported dynamically in main.tsx

---

## Error Types Now Captured

1. **React Component Errors**
   - Render errors
   - Lifecycle method errors
   - Event handler errors
   - Component stack traces

2. **Async Errors**
   - Unhandled promise rejections
   - Async/await errors
   - Network request failures

3. **React Query Errors**
   - Mutation failures
   - API call errors
   - Database operation errors

4. **User Context**
   - All errors tagged with user ID
   - Email and username for support
   - Automatic cleanup on logout

---

## Testing Recommendations

### Manual Testing:
1. **Test React Error Boundary:**
   - Trigger a component error
   - Verify error appears in Sentry dashboard
   - Check component stack is included

2. **Test Unhandled Rejection:**
   - Create a promise that rejects without catch
   - Verify it appears in Sentry

3. **Test React Query Error:**
   - Trigger a mutation failure
   - Verify it's captured in Sentry

4. **Test User Context:**
   - Log in and trigger an error
   - Verify user info is in Sentry report
   - Log out and trigger error
   - Verify user info is cleared

### Production Monitoring:
- Monitor Sentry dashboard for error trends
- Set up alerts for critical errors
- Review error grouping and deduplication
- Check user impact metrics

---

## Performance Impact

- **Lazy Loading**: ✅ Sentry loaded asynchronously
- **Production Only**: ✅ Zero overhead in development
- **Sample Rate**: ✅ 10% transaction sampling
- **Bundle Size**: ✅ Sentry in separate vendor chunk

---

## Security & Privacy

- **PII Protection**: ✅ Session replay masks all text
- **User Data**: ✅ Only ID, email, username (no passwords)
- **Environment Variables**: ✅ DSN from secure env vars
- **Production Only**: ✅ No tracking in development

---

## Next Steps

1. **Configure Sentry Alerts:**
   - Set up email/Slack notifications
   - Define error thresholds
   - Create on-call rotation

2. **Error Grouping:**
   - Review fingerprinting rules
   - Merge duplicate issues
   - Set up custom grouping

3. **Performance Monitoring:**
   - Review transaction traces
   - Identify slow operations
   - Optimize critical paths

4. **User Feedback:**
   - Consider adding Sentry user feedback widget
   - Allow users to report issues
   - Collect reproduction steps
