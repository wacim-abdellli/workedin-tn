# PHASE 5: PAYMENT FLOW TESTING
**Status:** Ready for Testing

---

## Payment Flow Overview

### How It Works:
1. **Client initiates payment** → `flouci-initiate-payment` edge function
2. **Client pays via Flouci** → Redirects to Flouci app/web
3. **Client returns** → Frontend shows pending
4. **Backend verifies** → `flouci-verify-payment` edge function confirms
5. **Funds held in escrow** → Contract created with `payment_status = 'funded'`
6. **Freelancer delivers** → Client approves
7. **Funds released** → `reconcile-payment` transfers to freelancer wallet

---

## Edge Functions

| Function | Purpose | Security |
|----------|---------|----------|
| flouci-initiate-payment | Start payment | Auth + CORS |
| flouci-verify-payment | Confirm payment | Auth + Contract check |
| reconcile-payment | Release funds | Auth + Admin |

---

## TEST CHECKLIST

### 1. Environment Variables Required
```bash
# In Supabase Edge Functions secrets:
FLOUCI_APP_TOKEN=your_token
FLOUCI_APP_SECRET=your_secret
FLOUCI_API_URL=https://developers.flouci.com/api
ALLOWED_ORIGIN=https://khedma.tn
```

### 2. Manual Tests to Perform

- [ ] **Wallet Page Load**
  - [ ] Check wallet balance displays
  - [ ] Check transaction history loads

- [ ] **Connect Flouci Wallet**
  - [ ] Click "Connect Flouci"
  - [ ] Redirect to Flouci auth
  - [ ] Return with connected status

- [ ] **Fund Escrow (Client)**
  - [ ] Open contract with freelancer
  - [ ] Click "Fund Escrow" / "Pay"
  - [ ] Complete Flouci payment
  - [ ] Verify contract status = 'funded'
  - [ ] Verify wallet balance decreased

- [ ] **Release Payment (Client)**
  - [ ] Review delivered work
  - [ ] Click "Approve & Pay"
  - [ ] Verify freelancer receives funds
  - [ ] Verify transaction recorded

- [ ] **Withdrawal (Freelancer)**
  - [ ] Go to wallet
  - [ ] Request withdrawal
  - [ ] Verify processing status

---

## Security Verification

### Edge Function Security Checks:
✅ Auth required on all functions
✅ CORS restricted to production domain
✅ APP_SECRET never exposed to client
✅ Contract ownership verified before payment
✅ Payment audit logging in place
✅ Only contract client can fund
✅ Only contract parties can release

---

## Troubleshooting

### If payment fails:
1. Check Flouci API keys in Supabase Edge Functions
2. Check payment_audit_log table for errors
3. Verify CORS settings match your domain
4. Check browser console for errors

### Common Issues:
- **CORS error** → Update ALLOWED_ORIGIN in secrets
- **Payment not verified** → Check flouci-verify-payment logs
- **Funds not released** → Verify contract status

---

## Test Accounts Needed:
1. Client account (with Flouci)
2. Freelancer account (with wallet)
3. Test contract between them
