# PHASE 6 E2E TESTING - DEBUG & FIX GUIDE

## Current Status

**E2E Tests**: Partially failing due to authentication timeout issues

**Test Suite**: Playwright (6 spec files)
- `auth.spec.ts` - Login/logout/auth flow
- `job-post.spec.ts` - Job posting workflow
- `proposal.spec.ts` - Proposal submission
- `payment-flow.spec.ts` - Payment processing
- `wallet.spec.ts` - Wallet operations
- `messaging.spec.ts` - Real-time messaging

**Primary Issue**: `auth.setup.ts` has 10-second timeout in login workflow

---

## Identified Problems

### Problem #1: Auth Setup Timeout (10 seconds)

**Location**: `e2e/auth.setup.ts`

**Root Cause**: Test account credentials don't exist in dev Supabase
- Email: `client-test@khedma.tn` - NOT in database
- Email: `freelancer-test@khedma.tn` - NOT in database

**Current Behavior**:
- Playwright tries to login
- Auth times out after 10 seconds
- Test fails before other specs can run

**Attempted Fix** (partially applied):
- Modified `src/auth.ts` to auto-signup test accounts if login fails
- Flag: `trySignUp = true` failsafe added
- Status: Needs verification/debugging

---

## What to do: E2E Testing Fix Guide

### Step 1: Verify test account setup

Create test accounts manually in Supabase:

```sql
-- In Supabase SQL Editor
-- Create test user #1 (Client)
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_user_meta_data, 
  created_at, updated_at, last_sign_in_at
) VALUES (
  'test-client-uuid-1234567890',
  'client-test@khedma.tn',
  NOW(),
  '{"name": "Test Client"}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create test user #2 (Freelancer)
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_user_meta_data,
  created_at, updated_at, last_sign_in_at
) VALUES (
  'test-freelancer-uuid-1234567890',
  'freelancer-test@khedma.tn',
  NOW(),
  '{"name": "Test Freelancer"}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create corresponding profiles
INSERT INTO profiles (
  id, role, display_name, bio, created_at, updated_at
) VALUES (
  'test-client-uuid-1234567890',
  'client',
  'Test Client',
  'Test client account for E2E testing',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (
  id, role, display_name, bio, created_at, updated_at
) VALUES (
  'test-freelancer-uuid-1234567890',
  'freelancer',
  'Test Freelancer',
  'Test freelancer account for E2E testing',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
```

### Step 2: Update auth.setup.ts

Location: `e2e/auth.setup.ts`

**Current issues**:
- Hard 10-second timeout
- No retry logic
- No account creation fallback

**Recommended changes**:

```typescript
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('/login');
  
  // Wait for login form with longer timeout
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  
  // Fill credentials
  const email = 'client-test@khedma.tn';
  const password = 'test-password-123456';
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click login button
  await page.click('button[type="submit"]', { timeout: 5000 });
  
  // Wait for redirect (indicate successful login)
  try {
    await page.waitForURL('/dashboard/**', { timeout: 10000 });
  } catch (error) {
    // If login fails, try signup flow
    console.log('Login failed, attempting signup...');
    
    await page.goto('/signup');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    
    // Select role (client or freelancer)
    await page.selectOption('select[name="role"]', 'client');
    
    // Agree to terms
    await page.check('input[name="agreeToTerms"]');
    
    // Submit signup
    await page.click('button[type="submit"]', { timeout: 5000 });
    
    // Wait for dashboard
    await page.waitForURL('/dashboard/**', { timeout: 15000 });
  }
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
```

### Step 3: Update playwright.config.ts

Location: `playwright.config.ts`

**Add setup configuration**:

```typescript
export default defineConfig({
  testDir: './e2e',
  
  fullyParallel: false, // Run tests sequentially to avoid auth conflicts
  
  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use auth state from setup
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minute startup timeout
  },
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  timeout: 30000, // 30 second test timeout
  expect: {
    timeout: 5000,
  },
  
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
});
```

### Step 4: Create .auth directory

```bash
mkdir -p playwright/.auth
```

### Step 5: Update .gitignore

Add to `.gitignore`:
```
# Playwright
playwright/.auth/
test-results/
playwright-report/
```

### Step 6: Run E2E tests

```bash
# Run setup only
npx playwright test e2e/auth.setup.ts --headed

# Run all E2E tests
npm run test:e2e

# Run specific test
npx playwright test e2e/job-post.spec.ts --headed
```

### Step 7: Debug if still failing

If tests still fail:

```bash
# Run with verbose logging
npx playwright test --debug

# Run with UI mode
npx playwright test --ui

# Record test trace
npx playwright test --trace on
```

Check reports:
```bash
# View HTML report
npx playwright show-report

# Check test results
cat test-results/results.json
```

---

## Verification Checklist

After implementing E2E fixes:

- [ ] Test accounts exist in dev Supabase (`client-test@khedma.tn`, `freelancer-test@khedma.tn`)
- [ ] `auth.setup.ts` runs without timeout
- [ ] `playwright/.auth/user.json` is created after setup
- [ ] All 6 E2E spec files run without auth errors
- [ ] `npm run test:e2e` completes successfully
- [ ] No flaky failures (run 3x to verify stability)

---

## Files to modify/create

- `e2e/auth.setup.ts` (UPDATE - add retry logic and signup fallback)
- `playwright.config.ts` (UPDATE - add setup project and dependencies)
- `playwright/.auth/` (CREATE - for auth state storage)
- `.gitignore` (UPDATE - add playwright auth exclusion)
- Supabase database (EXECUTE - SQL to create test accounts)

---

## Effort & Priority

**Effort**: 3-4 hours

**Priority**: HIGH (E2E tests are critical for production verification)

**Blockers**: Test account creation in Supabase must happen first

---

## Success Criteria

- ✅ All 6 E2E spec files pass consistently (3 consecutive runs)
- ✅ No timeout errors
- ✅ Auth state persists across tests
- ✅ Test reports generated in `test-results/`
- ✅ HTML report shows all tests green

---

## When done, report back with:

1. ✅ Test account creation status (Supabase SQL executed)
2. ✅ E2E test results (pass/fail count)
3. ✅ Any flaky tests identified
4. ✅ HTML report link or summary
5. ⚠️ Any blockers found

---

## Reference Files

- Existing setup: `e2e/auth.setup.ts` (current - 10s timeout issue)
- Config: `playwright.config.ts` (current - may need updates)
- Test specs: `e2e/*.spec.ts` (6 files waiting on auth fix)

---

**Next Step After E2E Fix**: All E2E tests passing → Ready to move to Phase 8 (Payment Audit)
