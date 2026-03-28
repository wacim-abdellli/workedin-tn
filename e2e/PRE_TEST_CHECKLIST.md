# Pre-Test Checklist

Before running the e2e tests, ensure all prerequisites are met:

## ✅ Environment Setup

- [ ] Node.js 20+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] `.env` file exists with valid Supabase credentials
- [ ] Dev server can start successfully (`npm run dev`)

## ✅ Test Users

- [ ] Freelancer test user created: `freelancer-test@khedma.tn`
- [ ] Client test user created: `client-test@khedma.tn`
- [ ] Both users have confirmed emails
- [ ] Both users have profiles with correct `user_type`
- [ ] Test users can log in manually through the UI

## ✅ Database State

- [ ] Supabase project is accessible
- [ ] RLS policies allow test users to access data
- [ ] Jobs table is accessible
- [ ] Proposals table is accessible
- [ ] Wallet/transactions tables are accessible
- [ ] No conflicting test data from previous runs

## ✅ Application State

- [ ] Dev server is running on `http://localhost:5173`
- [ ] Application loads without errors
- [ ] Login page is accessible
- [ ] Job board is accessible
- [ ] No console errors on page load

## ✅ Test Configuration

- [ ] `playwright.config.ts` has correct baseURL
- [ ] Test files are in `e2e/` directory
- [ ] Auth fixtures are properly configured
- [ ] Test user credentials match in `e2e/fixtures/auth.ts`

## 🚀 Ready to Run

Once all items are checked, run:

```bash
# First time: Run auth setup
npx playwright test e2e/auth.setup.ts

# Then run all tests
npm run test:e2e

# Or use UI mode for development
npm run test:e2e:ui
```

## 🔍 Verification Commands

### Check Node version
```bash
node --version  # Should be 20+
```

### Check Playwright installation
```bash
npx playwright --version
```

### Check dev server
```bash
curl http://localhost:5173  # Should return HTML
```

### Check Supabase connection
```bash
# In browser console on your app:
# await supabase.auth.getSession()
# Should return session data
```

## ⚠️ Common Issues

### "Cannot find module '@playwright/test'"
**Solution**: Run `npm install`

### "Executable doesn't exist"
**Solution**: Run `npx playwright install`

### "Connection refused"
**Solution**: Start dev server with `npm run dev`

### "Invalid login credentials"
**Solution**: Verify test users exist and credentials are correct

### "Timeout waiting for page"
**Solution**: Check dev server is running and accessible

## 📝 Notes

- Tests use authentication fixtures to avoid logging in for every test
- First run will be slower as it sets up auth state
- Subsequent runs will be faster using cached auth
- Clear `e2e/.auth/` if authentication issues occur
- Check `playwright-report/` for detailed test results

## 🆘 Need Help?

1. Check `e2e/README.md` for full documentation
2. Check `e2e/QUICK_START.md` for quick reference
3. Check `e2e/setup-test-users.md` for user setup
4. Run tests in UI mode to debug: `npm run test:e2e:ui`
5. Check Playwright logs and screenshots in `test-results/`
