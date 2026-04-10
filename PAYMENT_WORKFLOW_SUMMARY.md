# WorkedIn Payment & Dhmad.tn Workflow

## 🎯 Overview

Your platform uses **Dhmad.tn** for escrow-based payments between clients and freelancers. Here's how it works:

---

## 💰 Payment Flow

### 1. Contract Creation & Acceptance
```
Client posts job → Freelancer submits proposal → Client accepts proposal
```

### 2. Escrow Creation (Automatic)
When a contract is accepted:
```typescript
// File: src/hooks/useContractState.ts or similar
import { createEscrow } from '@/services/dhmad';

const escrow = await createEscrow({
  amount: contract.budget,
  buyer_id: contract.client_id,
  seller_id: contract.freelancer_id,
  contract_id: contract.id,
  description: `Escrow for contract ${contract.id}`,
});

// Stores escrow_id in database
contract.dhmad_escrow_id = escrow.escrow_id;
contract.payment_status = 'pending';
```

### 3. Client Pays into Escrow
```
Client → Dhmad Checkout → Funds held in escrow
```
- Client receives payment link from Dhmad
- Pays via credit card, bank transfer, or other methods
- Funds are held securely by Dhmad

### 4. Freelancer Delivers Work
```
Freelancer completes work → Submits deliverable → Client reviews
```

### 5. Payment Release
When client approves work:
```typescript
import { releaseEscrow } from '@/services/dhmad';

await releaseEscrow(
  contract.dhmad_escrow_id,
  contract.id
);

// Updates contract
contract.payment_status = 'released';
contract.status = 'completed';
```

### 6. Funds Transfer
```
Dhmad → Freelancer's Wallet → Freelancer can withdraw
```

---

## 🏦 Wallet System

### Current Balance Display
```
src/pages/Wallet.tsx
```

Shows:
- **Available Balance**: Money freelancer can withdraw
- **Pending in Escrow**: Money held in active contracts
- **Total Earned**: Lifetime earnings
- **Total Withdrawn**: Money already withdrawn

### Deposit Flow (For Testing)
```typescript
// Client deposits money to wallet
const payment = await initiatePayment({
  amount: Math.round(amount * 1000), // Convert to millimes
  success_link: `${window.location.origin}/payment/success`,
  fail_link: `${window.location.origin}/payment/failed`,
});

window.location.href = payment.link; // Redirect to Dhmad checkout
```

### Withdrawal Flow
```typescript
// Freelancer requests withdrawal
POST /api/withdrawals
{
  amount: 500,
  method: 'bank_transfer', // or 'mobile_money'
  bank_details: { ... }
}

// Admin approves → Money sent to freelancer
```

---

## 🔧 Technical Setup

### 1. Supabase Secrets (Required)
```bash
# Your API key (already provided)
npx supabase secrets set DHMAD_API_KEY="sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08" --project-ref YOUR_PROJECT_REF

# Dhmad API endpoint
npx supabase secrets set DHMAD_BASE_URL="https://dhmad.tn/api/v1" --project-ref YOUR_PROJECT_REF

# Your domain for CORS
npx supabase secrets set ALLOWED_ORIGIN="https://workedin.tn" --project-ref YOUR_PROJECT_REF
```

### 2. Edge Functions (5 total)
Located in `supabase/functions/`:

1. **dhmad-create-escrow** - Creates escrow when contract accepted
2. **dhmad-release-escrow** - Releases funds to freelancer
3. **dhmad-refund-escrow** - Refunds client if dispute
4. **dhmad-get-escrow-status** - Checks escrow status
5. **dhmad-checkout-session** - Creates payment checkout

### 3. Database Schema
```sql
-- contracts table
ALTER TABLE contracts 
ADD COLUMN dhmad_escrow_id TEXT;

-- Stores Dhmad's escrow ID for tracking
```

---

## 📊 Payment States

### Contract Payment Status
- `pending` - Escrow created, waiting for client payment
- `funded` - Client paid, funds in escrow
- `released` - Funds released to freelancer
- `refunded` - Funds returned to client
- `disputed` - Under dispute resolution

### Transaction Types
- `escrow_deposit` - Client pays into escrow
- `escrow_release` - Freelancer receives payment
- `escrow_refund` - Client gets refund
- `withdrawal` - Freelancer withdraws to bank
- `deposit` - Manual wallet deposit

---

## 🎨 UI Components

### Payment Modal
```
src/components/ui/PaymentModal.tsx
```
- Shows payment amount
- Displays Dhmad checkout link
- Handles payment confirmation

### Wallet Page
```
src/pages/Wallet.tsx
```
- Balance overview
- Transaction history
- Withdrawal requests
- Deposit functionality

### Payment Success/Failed Pages
```
src/pages/PaymentSuccess.tsx
src/pages/PaymentFailed.tsx
```
- Redirect pages after Dhmad checkout
- Update contract status
- Show confirmation message

---

## 🔄 Complete User Journey

### For Clients:
1. Post a job
2. Review proposals
3. Accept a proposal → **Escrow created**
4. Receive payment link → **Pay into escrow**
5. Review deliverable
6. Approve work → **Funds released to freelancer**

### For Freelancers:
1. Browse jobs
2. Submit proposal
3. Wait for acceptance
4. Deliver work
5. Wait for approval
6. **Receive payment in wallet**
7. Request withdrawal
8. Receive money in bank account

---

## 🚀 Quick Start Commands

### Find Your Project Reference
```bash
# Check your .env.local file
cat .env.local | grep VITE_SUPABASE_URL
# Example: https://abcdefgh.supabase.co
# Project ref: abcdefgh
```

### Set Up Dhmad (One Command)
```bash
# Windows PowerShell
.\scripts\setup-dhmad.ps1 YOUR_PROJECT_REF

# Mac/Linux
./scripts/setup-dhmad.sh YOUR_PROJECT_REF
```

### Manual Setup
```bash
# 1. Set secrets
npx supabase secrets set DHMAD_API_KEY="sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08" --project-ref YOUR_PROJECT_REF
npx supabase secrets set DHMAD_BASE_URL="https://dhmad.tn/api/v1" --project-ref YOUR_PROJECT_REF
npx supabase secrets set ALLOWED_ORIGIN="https://workedin.tn" --project-ref YOUR_PROJECT_REF

# 2. Deploy functions
npx supabase functions deploy --project-ref YOUR_PROJECT_REF

# 3. Verify
npx supabase secrets list --project-ref YOUR_PROJECT_REF
```

### Test It
```bash
# Start dev server
npm run dev

# Create a test contract
# Accept the proposal
# Check console for Dhmad logs
```

---

## 🐛 Troubleshooting

### "DHMAD_API_KEY is not set"
```bash
# Re-run setup
npx supabase secrets set DHMAD_API_KEY="sk_live_..." --project-ref YOUR_REF
```

### "Failed to create escrow"
- Check Dhmad API status
- Verify API key is correct
- Check Edge Function logs:
```bash
npx supabase functions logs dhmad-create-escrow --project-ref YOUR_REF
```

### "Payment link not generated"
- Check Dhmad dashboard
- Verify account is approved
- Check for API errors in console

---

## 📞 Support

### Dhmad Support
- Email: [email protected]
- Dashboard: https://dashboard.dhmad.tn
- Docs: https://docs.dhmad.tn

### Your API Key
```
sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08
```

---

## ✅ Current Status

- ✅ Dhmad API key received
- ✅ Code integration complete
- ✅ Edge Functions ready
- ⏳ Secrets need to be set
- ⏳ Functions need to be deployed
- ⏳ Production testing needed

---

## 🎯 Next Steps

1. **Find your Supabase project reference**
2. **Run setup script** (5 minutes)
3. **Test in development** (works with mocks)
4. **Deploy to production** (when ready)
5. **Test with real payments**

---

**Last Updated**: 2026-04-10
**Status**: Ready to configure
**Estimated Setup Time**: 15-30 minutes
