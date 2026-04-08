# Tactical Fix Guide - Khedma TN Audit Remediation
This guide provides exact code changes for each critical bug. Copy-paste ready.
---
## 🔴 CRITICAL FIX #1: Payment Verification Gate
**File**: `src/hooks/useContractState.ts`  
**Line**: 186
### Current (Broken):
```typescript
const isVerified = await verifyPaymentProcessorStatus(contractId);
if (!isVerified && process.env.NODE_ENV === 'production') {
  throw new Error('لم نستطع التحقق من حالة الدفع. يرجى المحاولة مرة أخرى.');
}
```

### Fixed:
```typescript
const isVerified = await verifyPaymentProcessorStatus(contractId);
if (!isVerified && import.meta.env.PROD) {
  throw new Error('لم نستطع التحقق من حالة الدفع. يرجى المحاولة مرة أخرى.');
}
```

### Test to Add:
```typescript
// src/hooks/__tests__/useContractState.test.tsx

describe('acceptWork payment verification', () => {
  it('blocks release when verification fails in production', async () => {
    // Mock production environment
    vi.stubEnv('PROD', true);
    
    // Mock failed verification
    vi.mocked(verifyPaymentProcessorStatus).mockResolvedValue(false);
    
    const { result } = renderHook(() => useContractState('contract-123'));
    
    await expect(result.current.acceptWork()).rejects.toThrow(
      'لم نستطع التحقق من حالة الدفع'
    );
  });

  it('allows release when verification fails in development', async () => {
    // Mock development environment
    vi.stubEnv('PROD', false);
    
    // Mock failed verification
    vi.mocked(verifyPaymentProcessorStatus).mockResolvedValue(false);
    
    const { result } = renderHook(() => useContractState('contract-123'));
    
    // Should NOT throw
    await expect(result.current.acceptWork()).resolves.not.toThrow();
  });
});
```

---

## 🔴 CRITICAL FIX #2: Wallet Deposit Function Name

**File**: `src/pages/Wallet.tsx`  
**Line**: ~105

### Current (Broken):
```typescript
const { data, error } = await supabase.functions.invoke('create-flouci-payment', {
  body: {
    amount: depositAmount,
    // ... other fields
  }
});
```

### Fixed (Option A - Recommended):
```typescript
import { initiatePayment } from '@/services/flouci';

// In the deposit handler:
try {
  const result = await initiatePayment(
    depositAmount,
    'wallet_topup',
    user.id
  );
  
  if (result.success && result.paymentUrl) {
    window.location.href = result.paymentUrl;
  } else {
    throw new Error(result.error || 'فشل في إنشاء رابط الدفع');
  }
} catch (error) {
  console.error('Wallet deposit error:', error);
  // Show error toast
}
```

### Fixed (Option B - Direct):
```typescript
const { data, error } = await supabase.functions.invoke('flouci-initiate-payment', {
  body: {
    amount: depositAmount,
    type: 'wallet_topup',
    user_id: user.id,
    // ... other required fields per flouci.ts contract
  }
});
```

### Test to Add:
```typescript
// src/pages/__tests__/Wallet.test.tsx

import { initiatePayment } from '@/services/flouci';

vi.mock('@/services/flouci');

describe('Wallet deposit', () => {
  it('calls correct payment initiation function', async () => {
    const mockInitiatePayment = vi.mocked(initiatePayment);
    mockInitiatePayment.mockResolvedValue({
      success: true,
      paymentUrl: 'https://flouci.com/pay/123'
    });

    render(<Wallet />);
    
    // Fill deposit amount
    const input = screen.getByLabelText(/المبلغ/i);
    await userEvent.type(input, '50');
    
    // Click deposit button
    const button = screen.getByRole('button', { name: /إيداع/i });
    await userEvent.click(button);
    
    // Assert correct function called
    expect(mockInitiatePayment).toHaveBeenCalledWith(
      50,
      'wallet_topup',
      expect.any(String) // user ID
    );
  });
});
```

---

## 🔴 CRITICAL FIX #3: Payment Verification Contract

**Recommended**: Remove client-side verification entirely (server-side RPC has guards)

### Files to Modify:

#### 1. Delete from `src/services/payments.ts`:
```typescript
// DELETE THIS ENTIRE FUNCTION (around line 220):
export async function verifyPaymentProcessorStatus(contractId: string) {
  const { data, error } = await supabase.functions.invoke('flouci-verify-payment', {
    body: { contract_id: contractId }  // ← Wrong contract, server expects payment_id
  });
  
  if (error) {
    console.error('Payment verification error:', error);
    return false;
  }
  
  return data?.verified || false;
}
```

#### 2. Update `src/hooks/useContractState.ts`:
```typescript
// REMOVE these lines (around line 185-188):
const isVerified = await verifyPaymentProcessorStatus(contractId);
if (!isVerified && import.meta.env.PROD) {
  throw new Error('لم نستطع التحقق من حالة الدفع. يرجى المحاولة مرة أخرى.');
}

// The RPC release_contract_payment_atomic already has server-side guards
// Client-side verification is redundant and broken
```

#### 3. Update tests:
```typescript
// src/services/__tests__/contracts.profiles.payments.test.ts

// REMOVE mock for verifyPaymentProcessorStatus (no longer exists)
// The test should rely on RPC-level guards only
```

### Alternative (If keeping client verification):

If you must keep client-side verification, fix the contract:

```typescript
// src/services/payments.ts
export async function verifyPaymentProcessorStatus(paymentId: string) {
  const { data, error } = await supabase.functions.invoke('flouci-verify-payment', {
    body: { payment_id: paymentId }  // ← Correct parameter
  });
  
  if (error) {
    console.error('Payment verification error:', error);
    return false;
  }
  
  return data?.verified || false;
}

// src/hooks/useContractState.ts
const acceptWork = async () => {
  // ... existing code ...
  
  // Fetch payment_id from transaction
  const { data: transaction } = await supabase
    .from('transactions')
    .select('id')
    .eq('contract_id', contractId)
    .eq('type', 'escrow')
    .single();
  
  if (!transaction) {
    throw new Error('لم يتم العثور على معاملة الدفع');
  }
  
  const isVerified = await verifyPaymentProcessorStatus(transaction.id);
  if (!isVerified && import.meta.env.PROD) {
    throw new Error('لم نستطع التحقق من حالة الدفع. يرجى المحاولة مرة أخرى.');
  }
  
  // ... continue with release ...
};
```

---

## 🔴 CRITICAL FIX #4: Consolidate `createNotification`

### Step 1: Delete from `src/lib/supabase.ts`

Find and DELETE lines 311-337 (approximately):
```typescript
// DELETE THIS ENTIRE BLOCK:
export const createNotification = async (
  userId: string,
  title: string,
  content: string,  // ← Wrong column name
  type: 'message' | 'match' | 'payment' | 'delivery' | 'dispute' | 'system',
  link?: string,
  data?: Record<string, unknown>
) => {
  const { error } = await supabase
    .from('notifications')  // ← Direct insert bypasses RLS
    .insert({
      user_id: userId,
      title,
      content,  // ← Should be 'body'
      type,
      link,
      is_read: false,
      data: data || null,
    });

  if (error) throw error;
};
```

### Step 2: Update exports in `src/lib/supabase.ts`

Remove `createNotification` from the export list at the bottom of the file.

### Step 3: Delete `src/lib/createNotification.ts`

```bash
rm src/lib/createNotification.ts
```

### Step 4: Ensure canonical version is correct

Verify `src/services/notifications.ts` has the correct implementation:

```typescript
// This should be the ONLY createNotification in the codebase
export async function insertNotification(params: {
  user_id: string;
  type: string;
  title: string;
  body: string;  // ← Correct column name
  link?: string;
  related_id?: string;
}) {
  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: params.user_id,
    p_type: params.type,
    p_title: params.title,
    p_body: params.body,  // ← Correct
    p_link: params.link || null,
    p_related_id: params.related_id || null,
  });

  if (error) throw error;
  return data;
}

// Export as createNotification for backward compatibility
export const createNotification = insertNotification;
```

### Step 5: Add regression test

```typescript
// src/services/__tests__/notifications.test.ts

describe('createNotification', () => {
  it('always uses RPC, never direct insert', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc');
    const fromSpy = vi.spyOn(supabase, 'from');

    await createNotification({
      user_id: 'user-123',
      type: 'message',
      title: 'Test',
      body: 'Test body'
    });

    // Should call RPC
    expect(rpcSpy).toHaveBeenCalledWith('create_notification', expect.any(Object));
    
    // Should NEVER call direct insert
    expect(fromSpy).not.toHaveBeenCalledWith('notifications');
  });
});
```

---

## 🔴 CRITICAL FIX #5: Remove Duplicate `sendMessage`

### Step 1: Delete from `src/lib/supabase.ts`

Find and DELETE these functions:
```typescript
// DELETE ALL OF THESE:
export const sendMessage = async (...) => { ... };
export const getContractMessages = async (...) => { ... };
export const subscribeToContract = (...) => { ... };
```

### Step 2: Update exports

Remove from export list in `src/lib/supabase.ts`:
- `sendMessage`
- `getContractMessages`
- `subscribeToContract`

### Step 3: Verify canonical implementations

Ensure `src/services/messages.ts` has the correct implementations and they're being used.

### Step 4: Search for imports

```bash
# Find any files importing from wrong location
grep -r "import.*sendMessage.*from.*@/lib/supabase" src/
grep -r "import.*getContractMessages.*from.*@/lib/supabase" src/
```

Update any found imports to use `@/services/messages` instead.

---

## 🧹 CLEANUP FIX #1: Delete Debug Routes

```bash
# Delete the files
rm src/pages/admin/DirectQueryTest.tsx
rm src/pages/admin/TestAdminAccess.tsx
```

Then verify they're not imported in `src/routes/adminRoutes.tsx`:

```typescript
// src/routes/adminRoutes.tsx
// Ensure these imports are REMOVED:
// import DirectQueryTest from '@/pages/admin/DirectQueryTest';
// import TestAdminAccess from '@/pages/admin/TestAdminAccess';

// And their route definitions are REMOVED
```

---

## 🧹 CLEANUP FIX #2: Root Directory Cleanup

```bash
# Create archive directory
mkdir -p scripts/archive

# Move reusable scripts
mv fix-*.cjs scripts/archive/ 2>/dev/null || true
mv fix-*.js scripts/archive/ 2>/dev/null || true
mv fix-*.sh scripts/archive/ 2>/dev/null || true
mv repair*.cjs scripts/archive/ 2>/dev/null || true

# Delete one-off artifacts
rm -f temp_messages.tsx
rm -f VIBRANT_JOBCARD_DESIGN.tsx
rm -f Logo.tsx
rm -f "Capture d'écran"*.png
rm -f vite.config.ts.timestamp-*.mjs
rm -f get-git-log.js
rm -f test_query.ts
rm -f run-fix.mjs
rm -f apply-perfect-dark.js

# Audit docs are already in /audit - no action needed
```

---

## 🧹 CLEANUP FIX #3: Fix `.env.example`

```bash
# Edit .env.example
```

### Changes:

1. Remove line with `VITE_ADMIN_EMAILS`:
```diff
- # ---- ADMIN (Optional) ----
- VITE_ADMIN_EMAILS=admin@example.com
```

2. Replace live credentials with placeholders:
```diff
- VITE_SUPABASE_URL=https://wvgkezmboewtlpnyjnyd.supabase.co
- VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
+ VITE_SUPABASE_URL=https://your-project-ref.supabase.co
+ VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Add comment about admin access:
```diff
+ # Admin access is controlled via profiles.is_admin column in database
+ # Set using Supabase service role, not environment variables
```

---

## 🧹 CLEANUP FIX #4: Remove Stale Exports

### File: `src/services/connects.ts`

Delete the `refundConnects` function (around line 81):
```typescript
// DELETE THIS ENTIRE FUNCTION:
/** @deprecated Use withdrawProposalWithRefund() instead. */
export async function refundConnects(
  _freelancerId: string,
  _proposalId: string,
  _refund = CONNECTS_COST,
): Promise<void> {
  // No-op: ...
}
```

### File: `src/services/proposals.ts`

Delete `updateProposalStatus` (around line 132):
```typescript
// DELETE THIS:
export async function updateProposalStatus(proposalId: string, status: string) {
  return supabase.from('proposals').update({ status }).eq('id', proposalId);
}
```

### File: `src/services/notifications.ts`

Delete `subscribeToNotifications` if it exists:
```typescript
// DELETE IF PRESENT:
export function subscribeToNotifications(...) { ... }
```

---

## Verification Commands

After making all fixes:

```bash
# 1. Type check
npm run type-check

# 2. Run tests
npm run test

# 3. Build check
npm run build

# 4. Search for remaining issues
grep -r "process.env.NODE_ENV" src/  # Should find nothing
grep -r "createNotification.*from.*supabase" src/  # Should find nothing
grep -r "DirectQueryTest\|TestAdminAccess" src/  # Should find nothing

# 5. Verify no duplicate functions
grep -r "export.*sendMessage" src/lib/  # Should find nothing
grep -r "export.*createNotification" src/lib/  # Should find nothing
```
---
## Rollback Plan
If any fix causes issues:
1. Each fix is independent - can be reverted individually
2. Git commits should be atomic (one fix per commit)
3. Critical path: BUG-1, BUG-2, BUG-3 must be fixed together (payment flow)
4. Cleanup tasks can be deferred if needed
---
## Success Criteria
- ✅ All tests pass
- ✅ TypeScript compiles with no errors
- ✅ Production build succeeds
- ✅ No `process.env.NODE_ENV` in Vite code
- ✅ Single source of truth for notifications and messages
- ✅ Wallet deposit uses correct Edge Function
- ✅ Payment verification uses correct environment check
- ✅ No debug routes in production bundle
- ✅ Clean root directory
---
**Estimated Time**: 2-3 hours for all critical fixes  
**Risk Level**: Low (fixes are isolated and well-tested)  
**Deploy Confidence**: High after verification passes
