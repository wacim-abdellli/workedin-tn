# Dhmad.tn Integration Plan - Khedma TN
**Date**: 2026-04-09  
**Decision**: Switch from Flouci to Dhmad.tn (Flouci requires business patente)

---

## 🚨 CRITICAL DECISION

**Flouci is BLOCKED**: Cannot open business account without patente (business registration)

**Solution**: Integrate Dhmad.tn immediately
- ✅ Perfect for freelance marketplace (escrow-native)
- ✅ Used by Tunisie Freelance (your competitor)
- ✅ No patente required for developer account
- ✅ Built specifically for marketplace escrow

---

## 📋 IMMEDIATE ACTION PLAN

### Phase 1: Get Dhmad Access (Day 1-2)

**Step 1: Apply for Developer Account**
1. Visit: https://developer.dhmad.tn/
2. Click "Apply for API Access" or "Create Developer Account"
3. Fill application with:
   - Company: Khedma TN
   - Use case: Freelance marketplace escrow
   - Expected volume: Start small, scale up
   - Contact: Your email and phone

**Step 2: Get Sandbox Access**
1. Once approved, login to dashboard
2. Generate sandbox API key (starts with `sk_sandbox_`)
3. Save key securely
4. Test endpoint: https://sandbox.dhmad.tn/api/v1

**Step 3: Contact Dhmad**
- Email: [email protected]
- Subject: "Freelance Marketplace Integration - Khedma TN"
- Ask about:
  - Approval timeline for production
  - Pricing/fees structure
  - Required documentation
  - Integration support

**Expected Timeline**: 1-3 days for sandbox, 3-7 days for production

---

### Phase 2: Code Integration (Day 3-5)

**Files to Create/Modify**:

#### 1. Create Dhmad Service (`src/services/dhmad.ts`)

```typescript
/**
 * Dhmad Escrow Service for Khedma TN
 * Documentation: https://docs.dhmad.tn
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface DhmadEscrowRequest {
  amount: number;
  buyer_id: string;
  seller_id: string;
  contract_id: string;
  description: string;
}

interface DhmadEscrowResponse {
  escrow_id: string;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  amount: number;
  created_at: string;
}

const IS_DEV_MODE = import.meta.env.DEV;

/**
 * Create escrow via Dhmad Edge Function
 */
export async function createEscrow(
  request: DhmadEscrowRequest
): Promise<DhmadEscrowResponse> {
  logger.log('[Dhmad] Creating escrow:', {
    amount: request.amount,
    contract_id: request.contract_id,
  });

  // Dev mode mock
  if (IS_DEV_MODE) {
    logger.log('[Dhmad] DEV mode - returning mock escrow');
    return {
      escrow_id: `mock_escrow_${Date.now()}`,
      status: 'pending',
      amount: request.amount,
      created_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('dhmad-create-escrow', {
      body: request
    });

    if (error) {
      logger.error('[Dhmad] Edge Function error:', error);
      throw new Error(error.message || 'فشل في إنشاء الضمان');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    logger.log('[Dhmad] Escrow created:', data);
    return data;
  } catch (error) {
    logger.error('[Dhmad] Escrow creation error:', error);
    throw error instanceof Error ? error : new Error('خطأ في إنشاء الضمان');
  }
}

/**
 * Release escrow funds to seller
 */
export async function releaseEscrow(
  escrowId: string,
  contractId: string
): Promise<{ success: boolean }> {
  logger.log('[Dhmad] Releasing escrow:', escrowId);

  if (IS_DEV_MODE) {
    logger.log('[Dhmad] DEV mode - mock release');
    return { success: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke('dhmad-release-escrow', {
      body: { escrow_id: escrowId, contract_id: contractId }
    });

    if (error) throw new Error(error.message || 'فشل في تحرير الأموال');
    if (data.error) throw new Error(data.error);

    logger.log('[Dhmad] Escrow released:', data);
    return { success: true };
  } catch (error) {
    logger.error('[Dhmad] Release error:', error);
    throw error instanceof Error ? error : new Error('خطأ في تحرير الأموال');
  }
}

/**
 * Refund escrow to buyer
 */
export async function refundEscrow(
  escrowId: string,
  contractId: string,
  reason: string
): Promise<{ success: boolean }> {
  logger.log('[Dhmad] Refunding escrow:', escrowId);

  if (IS_DEV_MODE) {
    logger.log('[Dhmad] DEV mode - mock refund');
    return { success: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke('dhmad-refund-escrow', {
      body: { escrow_id: escrowId, contract_id: contractId, reason }
    });

    if (error) throw new Error(error.message || 'فشل في استرجاع الأموال');
    if (data.error) throw new Error(data.error);

    logger.log('[Dhmad] Escrow refunded:', data);
    return { success: true };
  } catch (error) {
    logger.error('[Dhmad] Refund error:', error);
    throw error instanceof Error ? error : new Error('خطأ في استرجاع الأموال');
  }
}

/**
 * Get escrow status
 */
export async function getEscrowStatus(
  escrowId: string
): Promise<DhmadEscrowResponse> {
  if (IS_DEV_MODE) {
    return {
      escrow_id: escrowId,
      status: 'funded',
      amount: 0,
      created_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('dhmad-get-escrow', {
      body: { escrow_id: escrowId }
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    logger.error('[Dhmad] Status check error:', error);
    throw error instanceof Error ? error : new Error('خطأ في التحقق من حالة الضمان');
  }
}
```

#### 2. Create Dhmad Edge Functions

**File**: `supabase/functions/dhmad-create-escrow/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DHMAD_API_KEY = Deno.env.get('DHMAD_API_KEY');
const DHMAD_BASE_URL = Deno.env.get('DHMAD_BASE_URL') || 'https://dhmad.tn/api/v1';

serve(async (req) => {
  try {
    const { amount, buyer_id, seller_id, contract_id, description } = await req.json();

    // Call Dhmad API
    const response = await fetch(`${DHMAD_BASE_URL}/escrows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DHMAD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        buyer_id,
        seller_id,
        reference: contract_id,
        description,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Escrow creation failed' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store escrow_id in contract
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase
      .from('contracts')
      .update({ 
        dhmad_escrow_id: data.escrow_id,
        payment_status: 'pending'
      })
      .eq('id', contract_id);

    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**File**: `supabase/functions/dhmad-release-escrow/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DHMAD_API_KEY = Deno.env.get('DHMAD_API_KEY');
const DHMAD_BASE_URL = Deno.env.get('DHMAD_BASE_URL') || 'https://dhmad.tn/api/v1';

serve(async (req) => {
  try {
    const { escrow_id, contract_id } = await req.json();

    // Call Dhmad API to release
    const response = await fetch(`${DHMAD_BASE_URL}/escrows/${escrow_id}/release`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DHMAD_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Release failed' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update contract status
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase
      .from('contracts')
      .update({ 
        payment_status: 'released',
        status: 'completed'
      })
      .eq('id', contract_id);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### 3. Update Contract Flow

**File**: `src/hooks/useContractState.ts`

Replace Flouci payment initiation with Dhmad escrow creation:

```typescript
// OLD (Flouci):
// const payment = await initiatePayment({ amount, contract_id });

// NEW (Dhmad):
import { createEscrow } from '@/services/dhmad';

const escrow = await createEscrow({
  amount: contract.budget,
  buyer_id: contract.client_id,
  seller_id: contract.freelancer_id,
  contract_id: contract.id,
  description: `Escrow for contract ${contract.id}`,
});
```

#### 4. Add Database Column

**Migration**: `supabase/migrations/YYYYMMDD_add_dhmad_escrow_id.sql`

```sql
-- Add Dhmad escrow ID to contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS dhmad_escrow_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_dhmad_escrow_id 
ON contracts(dhmad_escrow_id);
```

---

### Phase 3: Testing (Day 6)

**Sandbox Testing Checklist**:
- [ ] Create escrow in sandbox
- [ ] Verify escrow status
- [ ] Release escrow funds
- [ ] Refund escrow
- [ ] Handle errors gracefully
- [ ] Test webhook callbacks (if Dhmad supports)

---

### Phase 4: Production Deployment (Day 7)

**Prerequisites**:
- [ ] Dhmad production account approved
- [ ] Production API key obtained
- [ ] Secrets set in Supabase
- [ ] Edge Functions deployed
- [ ] Database migration applied

**Deployment Steps**:
1. Set Dhmad secrets:
   ```bash
   npx supabase secrets set DHMAD_API_KEY=sk_live_...
   npx supabase secrets set DHMAD_BASE_URL=https://dhmad.tn/api/v1
   ```

2. Deploy Edge Functions:
   ```bash
   npx supabase functions deploy dhmad-create-escrow
   npx supabase functions deploy dhmad-release-escrow
   npx supabase functions deploy dhmad-refund-escrow
   ```

3. Run migration:
   ```bash
   npx supabase db push
   ```

4. Deploy frontend:
   ```bash
   git push origin main
   ```

---

## 🔄 MIGRATION FROM FLOUCI

### Files to Update:

1. **Remove Flouci imports**:
   - `src/lib/flouci.ts` → Keep for reference, mark deprecated
   - `src/pages/Wallet.tsx` → Update to use Dhmad
   - `src/hooks/useContractState.ts` → Update payment flow

2. **Update payment flow**:
   ```typescript
   // OLD: Flouci redirect
   const payment = await initiatePayment({ amount });
   window.location.href = payment.link;

   // NEW: Dhmad escrow
   const escrow = await createEscrow({ amount, buyer_id, seller_id, contract_id });
   // Dhmad handles payment collection, you just create escrow
   ```

3. **Update contract states**:
   - `pending_payment` → `escrow_pending`
   - `payment_verified` → `escrow_funded`
   - `payment_released` → `escrow_released`

---

## 💰 COST COMPARISON

### Flouci (Blocked)
- ❌ Requires patente (business registration)
- ❌ Cannot proceed without legal entity
- Estimated fees: 2-3% per transaction

### Dhmad.tn (Available)
- ✅ No patente required for developer account
- ✅ Can start immediately
- ✅ Escrow-native (better for marketplace)
- Fees: TBD (contact [email protected])
- Likely: 2-5% per transaction (industry standard)

---

## 📞 IMMEDIATE ACTIONS FOR YOU

### Today (Day 1):
1. **Apply for Dhmad developer account**:
   - Visit: https://developer.dhmad.tn/
   - Fill application form
   - Mention: "Freelance marketplace like Tunisie Freelance"

2. **Email Dhmad**:
   - To: [email protected]
   - Subject: "Freelance Marketplace Integration - Khedma TN"
   - Body:
     ```
     Hello Dhmad Team,

     I'm building Khedma TN, a freelance marketplace similar to Tunisie Freelance.
     I need escrow services for holding payments between clients and freelancers.

     Questions:
     1. What is the approval timeline for production API access?
     2. What are your fees/pricing for marketplace escrow?
     3. Do you require business registration (patente) for production?
     4. Can you provide integration support?

     Expected volume: Starting with 10-20 contracts/month, scaling to 100+

     Thank you,
     [Your Name]
     Khedma TN
     ```

3. **Check if you need patente for Dhmad**:
   - Ask in your email
   - If yes, you have same problem
   - If no, you're good to go!

### Tomorrow (Day 2):
- Wait for Dhmad response
- Start code integration in parallel (use sandbox)
- Test in development mode

### Day 3-5:
- Complete integration
- Test thoroughly in sandbox
- Prepare for production

### Day 6-7:
- Get production approval
- Deploy to production
- Launch!

---

## ⚠️ ALTERNATIVE IF DHMAD ALSO REQUIRES PATENTE

If Dhmad also requires business registration, you have 3 options:

### Option A: Get Patente (Recommended)
- Register as "Auto-Entrepreneur" or "Personne Physique"
- Timeline: 1-2 weeks
- Cost: Minimal (few hundred TND)
- Benefits: Legal protection, can invoice, professional

### Option B: Partner with Someone Who Has Patente
- Find a partner with business registration
- Use their account for payment processing
- Revenue sharing agreement
- Risk: Dependency on partner

### Option C: Launch Without Automated Payments
- Manual escrow (you hold funds)
- High operational overhead
- Trust issues
- Not recommended, but possible for MVP

---

## 🎯 RECOMMENDED PATH

1. **Apply to Dhmad TODAY** (no cost, takes 5 minutes)
2. **Ask if patente required** in your email
3. **If NO patente needed**: Integrate Dhmad (5-7 days)
4. **If patente needed**: Start patente process in parallel (1-2 weeks)

**Timeline to Launch**:
- Best case (no patente): 7-10 days
- Worst case (need patente): 3-4 weeks

---

## 📋 CHECKLIST

### Immediate (Today):
- [ ] Apply for Dhmad developer account
- [ ] Email Dhmad with questions
- [ ] Ask about patente requirement
- [ ] Get sandbox API key

### This Week:
- [ ] Create Dhmad service file
- [ ] Create Edge Functions
- [ ] Update contract flow
- [ ] Add database column
- [ ] Test in sandbox

### Next Week:
- [ ] Get production approval
- [ ] Set production secrets
- [ ] Deploy Edge Functions
- [ ] Deploy frontend
- [ ] Run live tests
- [ ] 🚀 LAUNCH

---

**Last Updated**: 2026-04-09  
**Status**: URGENT - Flouci blocked, Dhmad is the path forward  
**Next Action**: Apply for Dhmad account TODAY
