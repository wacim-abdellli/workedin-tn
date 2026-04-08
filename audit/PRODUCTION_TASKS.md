# PRODUCTION DEPLOYMENT TASK LIST
**Total Tasks:** 25
**Estimated Time:** 4-6 hours

---

## PHASE 1: CRITICAL - Hardcoded Strings (TASK 1-8)
**Impact:** 50+ Arabic strings hardcoded - French/English users see wrong text

### Task 1: Fix PortfolioDashboard.tsx
- [ ] `src/pages/PortfolioDashboard.tsx`
- Add to ar.ts, fr.ts, en.ts under `portfolio` namespace
- Replace 6 hardcoded strings with `t.portfolio.xxx`

### Task 2: Fix JobProposals.tsx
- [ ] `src/pages/JobProposals.tsx`
- Replace 12 hardcoded strings
- Examples: "فشل تحميل العروض", "تم توظيف المستقل بنجاح"

### Task 3: Fix JobDetail.tsx
- [ ] `src/pages/JobDetail.tsx`
- Replace 8 hardcoded strings
- Examples: "تم حفظ الوظيفة", "تم إرسال العرض بنجاح"

### Task 4: Fix ContractWorkspace.tsx
- [ ] `src/pages/ContractWorkspace.tsx`
- Replace 10 hardcoded strings
- Examples: "تم تسليم العمل بنجاح", "تم قبول العمل"

### Task 5: Fix JobMatches.tsx
- [ ] `src/pages/JobMatches.tsx`
- Replace 3 hardcoded strings

### Task 6: Fix ResetPassword.tsx & ForgotPassword.tsx
- [ ] `src/pages/ResetPassword.tsx` - 2 strings
- [ ] `src/pages/ForgotPassword.tsx` - 2 strings

### Task 7: Fix Component Files
- [ ] `src/components/auth/LoginForm.tsx` - password show/hide aria-label
- [ ] `src/components/ui/Reviews.tsx` - client/freelancer labels
- [ ] `src/components/settings/ReportButton.tsx` - "Report" text
- [ ] `src/components/layout/Header/index.tsx` - "Search" placeholder

### Task 8: Fix JobBoard.tsx
- [ ] `src/pages/JobBoard.tsx` - generic "Error" message

---

## PHASE 2: SECURITY - RLS Verification (TASK 9-12)

### Task 9: Create RLS Diagnostic SQL
- [ ] Create SQL to check all RLS policies status
- [ ] Run against Supabase

### Task 10: Test Public Access
- [ ] Test job listing as anonymous user
- [ ] Test freelancer search as anonymous user

### Task 11: Test Protected Routes
- [ ] Test job creation (requires auth)
- [ ] Test proposal submission (requires auth)
- [ ] Test payment flow (requires auth)

### Task 12: Verify Admin Access
- [ ] Confirm admin dashboard shows real data
- [ ] Confirm admin can view all users/jobs

---

## PHASE 3: Error Handling (TASK 13-16)

### Task 13: Replace console.error with Toast
- [ ] AdminDashboard.tsx - 4 occurrences
- [ ] UsersTab.tsx - 4 occurrences

### Task 14: Add Error Boundaries
- [ ] Check existing ErrorBoundary coverage
- [ ] Add fallback UI for failed components

### Task 15: Add Retry Logic
- [ ] Review API calls lacking retry
- [ ] Add retry button for failed operations

### Task 16: User-Friendly Error Messages
- [ ] Replace generic errors with helpful messages
- [ ] Include action items for users

---

## PHASE 4: Loading States (TASK 17-19)

### Task 17: Skeleton Loaders
- [ ] Identify pages missing skeletons
- [ ] Add skeleton components

### Task 18: Loading Spinners
- [ ] Verify all buttons have loading state
- [ ] Verify form submissions show loading

### Task 19: Optimistic Updates
- [ ] Review mutation handlers
- [ ] Add optimistic UI where appropriate

---

## PHASE 5: Payment Flow (TASK 20-22)

### Task 20: Test Wallet Connect
- [ ] Connect Flouci wallet
- [ ] Verify balance display

### Task 21: Test Payment to Freelancer
- [ ] Create contract
- [ ] Fund escrow
- [ ] Release payment
- [ ] Verify freelancer receives funds

### Task 22: Test Withdrawal
- [ ] Request withdrawal
- [ ] Verify processing

---

## PHASE 6: E2E Verification (TASK 23-25)

### Task 23: User Journeys
- [ ] Freelancer signup → profile → find jobs → submit proposal
- [ ] Client signup → post job → hire → pay

### Task 24: Mobile Testing
- [ ] Test all flows on mobile viewport
- [ ] Fix any responsive issues

### Task 25: Production Checklist
- [ ] Run `npm run audit:strict`
- [ ] Verify no console errors in production build
- [ ] Test with production .env values

---

## QUICK START COMMANDS

```bash
# Check i18n compliance
npm run i18n:audit:strict

# Run tests
npm run test:run

# Build for production
npm run build

# Full audit
npm run audit:strict
```
