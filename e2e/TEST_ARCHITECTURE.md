# E2E Test Architecture

## 📁 Directory Structure

```
e2e/
├── fixtures/
│   ├── auth.ts              # Authentication helpers & fixtures
│   └── test-data.ts         # Test data factories & constants
├── .auth/                   # Generated auth state (gitignored)
│   ├── freelancer.json      # Freelancer session
│   └── client.json          # Client session
├── auth.setup.ts            # Auth setup (runs before tests)
├── auth.spec.ts             # Authentication tests (7 tests)
├── job-post.spec.ts         # Job posting tests (5 tests)
├── proposal.spec.ts         # Proposal tests (6 tests)
├── wallet.spec.ts           # Wallet tests (10 tests)
├── README.md                # Full documentation
├── QUICK_START.md           # Quick reference
├── PRE_TEST_CHECKLIST.md    # Pre-test checklist
├── setup-test-users.md      # User setup guide
└── .gitignore               # Ignore auth state & results
```

## 🔄 Test Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Execution Flow                      │
└─────────────────────────────────────────────────────────────┘

1. Setup Phase (auth.setup.ts)
   ├── Login as freelancer
   │   └── Save session → .auth/freelancer.json
   └── Login as client
       └── Save session → .auth/client.json

2. Test Phase (parallel execution)
   ├── auth.spec.ts (no auth required)
   │   ├── Signup test
   │   ├── Login test
   │   ├── Invalid credentials test
   │   ├── Protected route test
   │   ├── Logout test
   │   ├── Password toggle test
   │   └── Forgot password test
   │
   ├── job-post.spec.ts (uses client auth)
   │   ├── Complete multi-step form
   │   ├── Form validation
   │   ├── Job appears on board
   │   ├── Draft save
   │   └── Hourly rate type
   │
   ├── proposal.spec.ts (uses freelancer auth)
   │   ├── View job & submit proposal
   │   ├── Form validation
   │   ├── Duplicate prevention
   │   ├── Appears in MyProposals
   │   ├── Fee calculation
   │   └── File attachment
   │
   └── wallet.spec.ts (uses freelancer auth)
       ├── Page loads with balance
       ├── Withdrawal modal opens
       ├── Min amount validation
       ├── Max amount validation
       ├── Method selection
       ├── Transaction history
       ├── Button disabled check
       ├── Stats cards display
       ├── Modal close
       └── Currency formatting

3. Reporting Phase
   ├── Generate HTML report
   ├── Save screenshots (on failure)
   ├── Save traces (on retry)
   └── Upload artifacts (in CI)
```

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Test Architecture                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Test Specs (*.spec.ts)                                       │
│ - Define test scenarios                                      │
│ - Use fixtures and helpers                                   │
│ - Assert expected behavior                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Fixtures (fixtures/*.ts)                                     │
│ - Authentication helpers                                     │
│ - Test data factories                                        │
│ - Reusable page objects                                      │
│ - Common selectors                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Playwright API                                               │
│ - Browser automation                                         │
│ - Page interactions                                          │
│ - Network interception                                       │
│ - Screenshot & trace                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Application Under Test                                       │
│ - Khedma TN (http://localhost:5173)                         │
│ - React + TypeScript                                         │
│ - Supabase backend                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              Authentication Flow (Optimized)                 │
└─────────────────────────────────────────────────────────────┘

Traditional Approach (Slow):
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Test 1   │───▶│  Login   │───▶│  Test    │
└──────────┘    └──────────┘    └──────────┘
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Test 2   │───▶│  Login   │───▶│  Test    │
└──────────┘    └──────────┘    └──────────┘
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Test 3   │───▶│  Login   │───▶│  Test    │
└──────────┘    └──────────┘    └──────────┘

Our Approach (Fast):
┌──────────────┐
│ Setup (Once) │
│  - Login     │
│  - Save      │
└──────┬───────┘
       │
       ├──────────────────────────────┐
       │                              │
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│ Test 1       │              │ Test 2       │
│ (Reuse auth) │              │ (Reuse auth) │
└──────────────┘              └──────────────┘
       │                              │
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│ Test 3       │              │ Test 4       │
│ (Reuse auth) │              │ (Reuse auth) │
└──────────────┘              └──────────────┘
```

## 🎯 Test Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Data Management                      │
└─────────────────────────────────────────────────────────────┘

Test Data Factory (test-data.ts)
        ↓
┌───────────────────────────────────────────────────────────┐
│ createJobData()                                            │
│ - Generates unique job with timestamp                      │
│ - Provides sensible defaults                               │
│ - Allows overrides for specific tests                      │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Test Spec                                                  │
│ const jobData = createJobData({ title: 'Custom' })        │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ Application                                                │
│ - Job created in database                                  │
│ - Unique identifier prevents conflicts                     │
└───────────────────────────────────────────────────────────┘
```

## 🔍 Selector Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Selector Hierarchy                        │
└─────────────────────────────────────────────────────────────┘

Priority 1: data-testid (most stable)
  ↓ Not available?
Priority 2: Semantic selectors (role, label)
  ↓ Not available?
Priority 3: Text content with i18n patterns
  ↓ Not available?
Priority 4: CSS selectors (least stable)

Example:
1. page.getByTestId('submit-button')           ✅ Best
2. page.getByRole('button', { name: 'Submit' }) ✅ Good
3. page.locator('button:has-text("Submit")')    ⚠️ OK
4. page.locator('.btn-primary')                 ❌ Fragile
```

## 🌍 Multi-Language Support

```
┌─────────────────────────────────────────────────────────────┐
│              i18n Pattern Matching Strategy                  │
└─────────────────────────────────────────────────────────────┘

Instead of:
  page.locator('text=Login')  ❌ Only works in English

We use:
  page.locator('text=/login|تسجيل الدخول|connexion/i')  ✅

Pattern includes:
  - English: login
  - Arabic: تسجيل الدخول
  - French: connexion
  - Case insensitive: /i flag

This works regardless of user's language preference!
```

## 📊 Test Reporting

```
┌─────────────────────────────────────────────────────────────┐
│                    Reporting Pipeline                        │
└─────────────────────────────────────────────────────────────┘

Test Execution
      ↓
┌─────────────────┐
│ Test Results    │
│ - Pass/Fail     │
│ - Duration      │
│ - Errors        │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         ↓                  ↓                  ↓
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ HTML Report    │  │ Screenshots    │  │ Traces         │
│ (Always)       │  │ (On Failure)   │  │ (On Retry)     │
└────────────────┘  └────────────────┘  └────────────────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                           ↓
                  ┌────────────────┐
                  │ CI Artifacts   │
                  │ (Uploaded)     │
                  └────────────────┘
```

## 🚀 Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                  Performance Strategies                      │
└─────────────────────────────────────────────────────────────┘

1. Auth Session Reuse
   - Login once, reuse 100x
   - Saves ~5 seconds per test
   - Total savings: ~2.5 minutes for 28 tests

2. Parallel Execution
   - Tests run concurrently
   - Utilizes multiple CPU cores
   - 4x faster on quad-core machine

3. Smart Waits
   - Wait for specific elements
   - No arbitrary timeouts
   - Faster and more reliable

4. Selective Screenshots
   - Only on failure
   - Reduces I/O overhead
   - Faster test execution

Result: 28 tests run in ~2-3 minutes instead of ~15 minutes!
```

## 🔄 CI/CD Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD Workflow                            │
└─────────────────────────────────────────────────────────────┘

GitHub Push/PR
      ↓
┌─────────────────┐
│ GitHub Actions  │
│ - Checkout code │
│ - Setup Node    │
│ - Install deps  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Install PW      │
│ - Browsers      │
│ - Dependencies  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Setup Env       │
│ - .env file     │
│ - Secrets       │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Run Tests       │
│ - All specs     │
│ - Retries: 2    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Upload Results  │
│ - HTML report   │
│ - Screenshots   │
│ - Traces        │
└─────────────────┘
```

## 📚 Documentation Structure

```
┌─────────────────────────────────────────────────────────────┐
│                  Documentation Hierarchy                     │
└─────────────────────────────────────────────────────────────┘

QUICK_START.md
  ↓ Need more details?
README.md
  ↓ Need setup help?
setup-test-users.md
  ↓ Ready to run?
PRE_TEST_CHECKLIST.md
  ↓ Want to understand architecture?
TEST_ARCHITECTURE.md (you are here!)
  ↓ Need implementation summary?
E2E_TESTS_SUMMARY.md
```

## 🎓 Learning Path

For new developers:
1. Start with `QUICK_START.md`
2. Run tests in UI mode: `npm run test:e2e:ui`
3. Read `README.md` for full context
4. Study `auth.spec.ts` as a simple example
5. Read this architecture doc for deeper understanding
6. Contribute new tests following established patterns!
