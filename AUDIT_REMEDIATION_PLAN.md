# Khedma TN - Consolidated Audit Remediation Plan
**Date**: 2026-04-08  
**Status**: ACCEPT WITH CRITICAL FIXES  
**Decision**: The codebase is production-ready after addressing 6 critical bugs and 4 cleanup tasks.

---

## Executive Summary

Three independent audits (GPT-5.4, Sonnet-4.6, Gemini-3.1-Pro) converged on the same critical findings:

1. **Payment verification gate is broken** (all 3 audits flagged)
2. **Duplicate notification/message logic** creates two sources of truth (all 3 audits)
3. **Debug routes exposed in production** (2 audits)
4. **Wallet deposit targets non-existent Edge Function** (1 audit, high severity)
5. **Root directory pollution** obscures deployment configs (all 3 audits)
---
## CRITICAL BUGS (Must Fix Before Next Deploy)
### 🔴 BUG-1: Payment Verification Gate Bypassed in All Environments
**Severity**: HIGH  
**File**: `src/hooks/useContractState.ts:186`  
**Audits**: GPT-5.4 (F-1), Sonnet-4.6 (Task 2), Gemini-3.1 (Finding C)

**Problem**:
```typescript
// CURRENT (BROKEN):
if (!isVerified && process.env.NODE_ENV === 'production') {
  throw new Error('لم نستطع التحقق من حالة الدفع...');
}
```

- `process.env.NODE_ENV` is a Node.js idiom, not Vite
- In Vite builds, this may be `undefined` → check silently passes even in production
- Staging/preview deployments skip verification entirely
- Client-side gate before `release_contract_payment_atomic` is completely bypassed

**Fix**:
```typescript
// CORRECT:
if (!isVerified && import.meta.env.PROD) {
  throw new Error('لم نستطع التحقق من حالة الدفع...');
}
```

**Test Coverage Required**:
- Add test: verification blocks release when `import.meta.env.PROD = true` and `isVerified = false`
- Add test: verification allows release in dev when `import.meta.env.PROD = false`

---

### 🔴 BUG-2: Wallet Deposit Calls Non-Existent Edge Function
**Severity**: HIGH  
**File**: `src/pages/Wallet.tsx:105`  
**Audit**: GPT-5.4 (High #1)

**Problem**:
```typescript
// CURRENT (BROKEN):
supabase.functions.invoke('create-flouci-payment', ...)
```

- Function `create-flouci-payment` does NOT exist in `supabase/functions/`
- Canonical client uses `flouci-initiate-payment` (see `src/services/flouci.ts:56`)
- Wallet top-up flow will fail 100% of the time even if Flouci credentials are fixed

**Fix**:
```typescript
// Option A: Use canonical helper
import { initiatePayment } from '@/services/flouci';
const result = await initiatePayment(amount, 'wallet_topup', userId);

// Option B: Align function name
supabase.functions.invoke('flouci-initiate-payment', {
  body: { amount, type: 'wallet_topup', user_id: userId }
})
```

**Test Coverage Required**:
- Add regression test: wallet deposit modal invokes correct function name
- Add integration test: wallet deposit payload matches `flouci-initiate-payment` contract

---

### 🔴 BUG-3: Payment Verification Contract Mismatch
**Severity**: HIGH  
**File**: `src/services/payments.ts:220` + `supabase/functions/flouci-verify-payment/index.ts:74`  
**Audit**: GPT-5.4 (High #2)

**Problem**:
```typescript
// CLIENT sends:
{ contract_id }

// SERVER expects:
{ payment_id }  // Line 74 of flouci-verify-payment
```

- Contract acceptance flow calls `verifyPaymentProcessorStatus(contractId)` 
- Edge Function explicitly requires `payment_id`
- Current tests mock `verifyPaymentProcessorStatus` to always return `true` → failure path untested

**Fix Options**:

**Option A (Recommended)**: Remove client-side verification entirely
```typescript
// Delete verifyPaymentProcessorStatus from payments.ts
// Rely on server-side RPC release_contract_payment_atomic guards only
```

**Option B**: Fix contract to use payment_id
```typescript
// payments.ts
export async function verifyPaymentProcessorStatus(paymentId: string) {
  const { data } = await supabase.functions.invoke('flouci-verify-payment', {
    body: { payment_id: paymentId }
  });
  return data?.verified || false;
}

// useContractState.ts - fetch payment_id first
const { data: payment } = await supabase
  .from('transactions')
  .select('id')
  .eq('contract_id', contractId)
  .single();
const isVerified = await verifyPaymentProcessorStatus(payment.id);
```

**Test Coverage Required**:
- Add test: `verifyPaymentProcessorStatus` failure path (currently mocked to always succeed)
- Add test: contract release blocked when verification returns `false`

---

### 🟡 BUG-4: Three Competing `createNotification` Implementations
**Severity**: MEDIUM  
**Files**: `src/lib/supabase.ts:311`, `src/lib/createNotification.ts`, `src/services/notifications.ts:58`  
**Audits**: Sonnet-4.6 (F-3, F-11), Gemini-3.1 (Finding A)

**Problem**:
1. `supabase.ts:311` - Direct table INSERT, uses column `content` (wrong), bypasses RLS
2. `createNotification.ts` - RPC path, uses `body` (correct)
3. `notifications.ts` - RPC path, uses `body` (correct)

Any import from `@/lib/supabase` hits the broken direct-insert path.

**Fix**:
```typescript
// 1. DELETE src/lib/supabase.ts lines 311-337 (createNotification function)
// 2. DELETE src/lib/createNotification.ts (or make it re-export from services)
// 3. KEEP only src/services/notifications.ts:insertNotification
```

**Test Coverage Required**:
- Add test: `createNotification` always calls `rpc('create_notification')`, never `from('notifications').insert()`

---

### 🟡 BUG-5: `sendMessage` Duplication Creates Real-Time Race Conditions
**Severity**: MEDIUM  
**Files**: `src/lib/supabase.ts` + `src/services/messages.ts`  
**Audits**: Gemini-3.1 (Finding A), Sonnet-4.6 (implied)

**Problem**:
- `supabase.ts` has inline `sendMessage` implementation
- `services/messages.ts` has canonical `sendMessage` implementation
- Two sources of truth for real-time messaging → unpredictable behavior

**Fix**:
```typescript
// DELETE from src/lib/supabase.ts:
// - sendMessage
// - getContractMessages
// - subscribeToContract

// KEEP only src/services/messages.ts implementations
```

---

### 🟡 BUG-6: `updateProposalStatus` Direct Table Update Bypasses RLS
**Severity**: LOW-MEDIUM  
**File**: `src/services/proposals.ts:132`  
**Audit**: Sonnet-4.6 (F-4)

**Problem**:
```typescript
export async function updateProposalStatus(proposalId: string, status: string) {
  return supabase.from('proposals').update({ status }).eq('id', proposalId);
}
```

- Zero callers (confirmed dead code)
- Accepts raw `status` string without validation
- Bypasses atomic RPCs (`submit_proposal_atomic`, `withdraw_proposal_atomic`)

**Fix**:
```typescript
// DELETE the function entirely, or mark:
/** @deprecated Use submit_proposal_atomic or withdraw_proposal_atomic RPCs */
```

---

## CLEANUP TASKS (Non-Breaking, High Priority)

### 🧹 CLEANUP-1: Delete Debug Routes from Production Bundle
**Files**: `src/pages/admin/DirectQueryTest.tsx`, `src/pages/admin/TestAdminAccess.tsx`  
**Audits**: Sonnet-4.6 (F-2), Gemini-3.1 (Finding B)

**Problem**:
- Both files contain live Supabase query blueprints
- `DirectQueryTest.tsx:37` sends anon key in Authorization header
- NOT referenced in routes (dead code) but still bundled
- Increases attack surface and bundle size

**Fix**:
```bash
rm src/pages/admin/DirectQueryTest.tsx
rm src/pages/admin/TestAdminAccess.tsx
```

---

### 🧹 CLEANUP-2: Root Directory Pollution (40+ Files)
**Audits**: All 3 audits flagged this

**Problem**:
```
fix-all-the-things.cjs
fix-auth-final.cjs
fix-colors-bulk.sh
fix-css-flat.cjs
... (30+ more fix-*.cjs files)
temp_messages.tsx
VIBRANT_JOBCARD_DESIGN.tsx
Logo.tsx (at root, shadows production component)
Capture d'écran *.png (screenshots)
vite.config.ts.timestamp-*.mjs (build artifacts)
```

**Fix**:
```bash
# Move reusable scripts
mkdir -p scripts/archive
mv fix-*.cjs fix-*.js fix-*.sh scripts/archive/

# Delete one-off artifacts
rm temp_messages.tsx VIBRANT_JOBCARD_DESIGN.tsx Logo.tsx
rm "Capture d'écran"*.png
rm vite.config.ts.timestamp-*.mjs
rm get-git-log.js test_query.ts repair*.cjs run-fix.mjs

# Audit docs already in /audit folder - no action needed
```

---

### 🧹 CLEANUP-3: Fix `.env.example` Stale Variables
**File**: `.env.example`  
**Audits**: Sonnet-4.6 (F-6, F-7)

**Problem**:
1. Still lists `VITE_ADMIN_EMAILS` (removed from code)
2. Contains live project URL and full anon key (should be placeholders)

**Fix**:
```bash
# Remove line 32:
- VITE_ADMIN_EMAILS=admin@example.com

# Replace lines 8-9:
- VITE_SUPABASE_URL=https://wvgkezmboewtlpnyjnyd.supabase.co
- VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
+ VITE_SUPABASE_URL=https://your-project-ref.supabase.co
+ VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### 🧹 CLEANUP-4: Remove Stale Exports
**Files**: Multiple  
**Audits**: Sonnet-4.6 (F-8), GPT-5.4 (F-2)

**Fix**:
```typescript
// src/services/connects.ts:81 - DELETE refundConnects (deprecated no-op)
// src/lib/supabase.ts - REMOVE from exports: createNotification, sendMessage, getContractMessages
// src/services/notifications.ts - DELETE subscribeToNotifications (legacy)
```

---

## DEPLOYMENT DOCS UPDATE (Critical for Ops)

### 📄 DOC-1: Update Deployment Guides for Server-Side Secrets
**Files**: `DEPLOYMENT_GUIDE_PRODUCTION.md`, `DEPLOYMENT_GUIDE_STAGING.md`  
**Audit**: GPT-5.4 (Medium #4)

**Problem**:
- Guides still reference client-side `VITE_SENDGRID_API_KEY`, `VITE_FLOUCI_MERCHANT_ID`
- Current runtime uses server-side Supabase function secrets

**Fix**:
Replace payment/email sections with:

```markdown
## Server-Side Secrets (Supabase Dashboard)

Navigate to Project Settings → Edge Functions → Secrets:

### Required Secrets:
- `FLOUCI_APP_TOKEN` - Flouci API token
- `FLOUCI_APP_SECRET` - Flouci API secret  
- `RESEND_API_KEY` - Resend email API key
- `ALLOWED_ORIGIN` - Frontend origin (e.g., https://khedma.tn)
- `APP_URL` - Application base URL

### Edge Functions with Public Access:
The following functions have `verify_jwt = false` in `supabase/config.toml`:
- `secure-upload`
- `flouci-initiate-payment`
- `flouci-verify-payment`

### Removed (No Longer Used):
- ~~`VITE_SENDGRID_API_KEY`~~ (SendGrid removed)
- ~~`VITE_FLOUCI_MERCHANT_ID`~~ (now server-side)
- ~~`VITE_FLOUCI_TEST_MODE`~~ (now server-side)
- ~~`VITE_ADMIN_EMAILS`~~ (admin access via `profiles.is_admin` DB column)
```

---

## TEST COVERAGE GAPS

### 🧪 TEST-1: Contract Workspace RPC Mocking
**File**: `src/components/__tests__/ContractWorkspace.test.tsx`  
**Audit**: Gemini-3.1 (Finding C)

**Problem**: Unmocked `supabase.rpc` calls cause runtime errors

**Fix**: Already fixed during audit (confirmed by Gemini)

---

### 🧪 TEST-2: Real-Time Chat `act()` Warnings
**File**: `src/hooks/__tests__/useRealtimeChat.test.tsx`  
**Audit**: Gemini-3.1 (Finding C)

**Problem**: Unresolved `act(...)` warnings hide real errors

**Fix**:
```typescript
// Wrap state updates in waitFor:
await waitFor(() => {
  expect(result.current.messages).toHaveLength(2);
});
```

---

## EXECUTION PLAN (Ordered by Risk)

### Phase 1: Critical Bugs (Deploy Blocker)
**Timeline**: Immediate (before next production deploy)

1. ✅ **BUG-1**: Fix payment verification gate (`useContractState.ts`)
2. ✅ **BUG-2**: Fix wallet deposit function name (`Wallet.tsx`)
3. ✅ **BUG-3**: Fix or remove payment verification contract mismatch
4. ✅ **BUG-4**: Consolidate `createNotification` to single source
5. ✅ **BUG-5**: Remove duplicate `sendMessage` from `supabase.ts`

### Phase 2: Security Cleanup
**Timeline**: Same sprint

6. ✅ **CLEANUP-1**: Delete debug routes
7. ✅ **CLEANUP-3**: Fix `.env.example`
8. ✅ **DOC-1**: Update deployment guides

### Phase 3: Hygiene
**Timeline**: Next sprint

9. ✅ **CLEANUP-2**: Root directory cleanup
10. ✅ **CLEANUP-4**: Remove stale exports
11. ✅ **BUG-6**: Delete `updateProposalStatus`
12. ✅ **TEST-2**: Fix `act()` warnings

---

## VERIFICATION CHECKLIST

After fixes, run:

```bash
# Type safety
npm run type-check

# Test suite
npm run test

# Build verification
npm run build

# Deployment dry-run
vercel build --prod
```

---

## NOTES FOR FUTURE AUDITS

### ✅ Previously Fixed (Confirmed Clean)
- `autoRefreshToken: false` → now `true` (R-1)
- `LeaveReview` wrong column → uses RPC (R-2)
- `ClientProfile` wrong column → uses `reviewee_id` (R-3)
- `VITE_ADMIN_EMAILS` bundle leak → removed (R-4)
- `window.supabase` debug leak → removed (R-8)
- `incrementJobViews` race → now RPC (R-6)

### 🔍 Known Gaps (Deferred, Non-Critical)
- `useAdminStats.totalRevenue` hardcoded to `0` (cosmetic, no security impact)
- Settings page profile completion bar at `85%` (cosmetic)

---

## SIGN-OFF

**Auditor Consensus**: ACCEPT WITH FIXES  
**Blocking Issues**: 5 critical bugs (BUG-1 through BUG-5)  
**Recommended Timeline**: Fix Phase 1 before next production deploy  
**Post-Fix Status**: Production-ready

---

**Last Updated**: 2026-04-08  
**Next Review**: After Phase 1 completion
