# End-to-End Tests for Khedma TN

This directory contains Playwright end-to-end tests for the most critical user flows in the Khedma TN platform.

## Test Coverage

### 1. Authentication Flow (`auth.spec.ts`)
- ✅ User can sign up with email
- ✅ User can log in with email/password
- ✅ Login fails with invalid credentials
- ✅ Protected routes redirect to login when unauthenticated
- ✅ User can log out
- ✅ Password visibility toggle works
- ✅ Forgot password link is present

### 2. Job Posting Flow (`job-post.spec.ts`)
- ✅ Client can complete the multi-step job post form
- ✅ Form validation prevents submission with missing fields
- ✅ Job appears on JobBoard after posting
- ✅ Draft save functionality works
- ✅ Hourly rate job type works

### 3. Proposal Submission Flow (`proposal.spec.ts`)
- ✅ Freelancer can view a job and submit a proposal
- ✅ Proposal form validation works
- ✅ Duplicate proposal is prevented
- ✅ Proposal appears in MyProposals
- ✅ Platform fee calculation is displayed
- ✅ File attachment works in proposal

### 4. Wallet Flow (`wallet.spec.ts`)
- ✅ Wallet page loads and shows balance
- ✅ Withdrawal modal opens and validates minimum amount
- ✅ Form prevents submission below MIN_WITHDRAWAL_AMOUNT (20 TND)
- ✅ Withdrawal form validates maximum amount
- ✅ Withdrawal method selection works
- ✅ Transaction history is displayed
- ✅ Withdrawal button is disabled when balance is below minimum
- ✅ Wallet stats cards are displayed
- ✅ Withdrawal modal can be closed
- ✅ Currency formatting is correct

## Setup

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Create test users in your Supabase database:
   - Freelancer: `freelancer-test@khedma.tn` / `TestPassword123!`
   - Client: `client-test@khedma.tn` / `TestPassword123!`

### Environment Variables

Ensure your `.env` file has the correct Supabase credentials:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run tests in UI mode (recommended for development)
```bash
npx playwright test --ui
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests with specific project
```bash
npx playwright test --project=chromium
```

## Test Structure

### Fixtures (`fixtures/auth.ts`)
- Reusable authentication helpers
- Test user credentials
- Login/logout utilities
- Authenticated page fixtures

### Setup (`auth.setup.ts`)
- Runs before all tests
- Creates authenticated sessions for freelancer and client
- Saves session state to `.auth/` directory

### Test Files
- `auth.spec.ts` - Authentication and authorization tests
- `job-post.spec.ts` - Job posting workflow tests (client role)
- `proposal.spec.ts` - Proposal submission tests (freelancer role)
- `wallet.spec.ts` - Wallet and withdrawal tests (freelancer role)

## Authentication Strategy

Tests use Playwright's authentication fixtures to:
1. Log in once per test run (in `auth.setup.ts`)
2. Save authenticated state to JSON files
3. Reuse authentication across tests for speed

This approach is much faster than logging in for every test.

## Debugging

### View test report
```bash
npx playwright show-report
```

### Debug specific test
```bash
npx playwright test e2e/auth.spec.ts --debug
```

### View traces for failed tests
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

Tests are configured to run in CI with:
- 2 retries for flaky tests
- Single worker for consistency
- HTML report generation
- Screenshots on failure
- Traces on first retry

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for network idle** when testing dynamic content
3. **Use unique identifiers** (timestamps) for test data
4. **Clean up test data** after tests when possible
5. **Keep tests independent** - each test should work in isolation
6. **Use fixtures** for common setup/teardown
7. **Test user flows**, not implementation details

## Troubleshooting

### Tests timing out
- Increase timeout in test: `test.setTimeout(60000)`
- Check if dev server is running
- Verify network connectivity

### Authentication failing
- Verify test users exist in database
- Check Supabase credentials in `.env`
- Clear `.auth/` directory and re-run setup

### Flaky tests
- Add explicit waits: `await page.waitForSelector()`
- Use `waitForLoadState('networkidle')`
- Increase retry count in config

## Adding New Tests

1. Create new spec file in `e2e/` directory
2. Import fixtures: `import { test, expect } from './fixtures/auth'`
3. Use `test.use({ storageState: 'e2e/.auth/freelancer.json' })` for authenticated tests
4. Follow existing patterns for consistency
5. Add test description to this README

## Notes

- Tests use Arabic, English, and French text patterns for i18n support
- Selectors are flexible to handle different languages
- Tests work with both light and dark themes
- Mobile viewport tests can be added using Playwright device emulation
