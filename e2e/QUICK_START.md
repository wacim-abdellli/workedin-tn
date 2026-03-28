# E2E Tests Quick Start Guide

## 🚀 First Time Setup

### 1. Install Playwright
```bash
npm install
npx playwright install
```

### 2. Create Test Users
Follow instructions in `setup-test-users.md` to create:
- `freelancer-test@khedma.tn` / `TestPassword123!`
- `client-test@khedma.tn` / `TestPassword123!`

### 3. Configure Environment
Ensure `.env` has valid Supabase credentials:
```env
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

### 4. Start Dev Server
```bash
npm run dev
```

### 5. Run Tests
```bash
npm run test:e2e
```

## 📋 Common Commands

### Run all tests
```bash
npm run test:e2e
```

### Run with UI (best for development)
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug a test
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## 🎯 Test Files

| File | Description | User Role |
|------|-------------|-----------|
| `auth.spec.ts` | Login, signup, logout, protected routes | Any |
| `job-post.spec.ts` | Multi-step job posting form | Client |
| `proposal.spec.ts` | Submit proposals to jobs | Freelancer |
| `wallet.spec.ts` | Wallet, withdrawals, transactions | Freelancer |

## 🔧 Troubleshooting

### Tests are failing
1. Check dev server is running on `http://localhost:5173`
2. Verify test users exist and are confirmed
3. Clear auth state: `rm -rf e2e/.auth`
4. Re-run setup: `npx playwright test e2e/auth.setup.ts`

### Timeout errors
- Increase timeout in test: `test.setTimeout(60000)`
- Check network connectivity
- Verify Supabase is responding

### Authentication not working
- Verify credentials in `e2e/fixtures/auth.ts`
- Check Supabase Auth logs
- Ensure email confirmation is enabled

## 💡 Tips

- Use `--ui` mode for interactive debugging
- Use `--headed` to see what the browser is doing
- Use `--debug` to step through tests line by line
- Check `playwright-report/` for detailed results
- Screenshots are saved on failure

## 📚 Learn More

- [Playwright Documentation](https://playwright.dev)
- [Test README](./README.md) - Full documentation
- [Setup Test Users](./setup-test-users.md) - User creation guide
