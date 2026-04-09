# Dhmad.tn Setup Guide - Khedma TN
**Date**: 2026-04-09  
**Status**: Ready to Configure  
**API Key Received**: ✅ sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08

---

## 🎉 CONGRATULATIONS!

You've been accepted as a developer by dhmad.tn and received your live API key. Now let's configure everything.

---

## 📋 STEP-BY-STEP SETUP

### Step 1: Set Supabase Secrets

You need to set the Dhmad API key as a Supabase secret so the Edge Functions can use it.

**Option A: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
npx supabase login

# Set the Dhmad API key
npx supabase secrets set DHMAD_API_KEY="sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08" --project-ref YOUR_PROJECT_REF

# Set the Dhmad base URL (production)
npx supabase secrets set DHMAD_BASE_URL="https://dhmad.tn/api/v1" --project-ref YOUR_PROJECT_REF

# Set allowed origin for CORS
npx supabase secrets set ALLOWED_ORIGIN="https://workedin.tn" --project-ref YOUR_PROJECT_REF
```

**Option B: Using Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions
2. Click on "Edge Functions" in the sidebar
3. Click "Manage secrets"
4. Add these secrets:
   - `DHMAD_API_KEY` = `sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08`
   - `DHMAD_BASE_URL` = `https://dhmad.tn/api/v1`
   - `ALLOWED_ORIGIN` = `https://workedin.tn`

---

### Step 2: Find Your Supabase Project Reference

You need your project reference ID to set secrets. Find it in:

1. **From Supabase Dashboard URL**:
   - Your dashboard URL looks like: `https://supabase.com/dashboard/project/abcdefghijklmnop`
   - The project ref is: `abcdefghijklmnop`

2. **From .env.local file**:
   - Your `VITE_SUPABASE_URL` looks like: `https://abcdefghijklmnop.supabase.co`
   - The project ref is: `abcdefghijklmnop`

---

### Step 3: Update Supabase Config

Add the Dhmad Edge Functions to your `supabase/config.toml`:

```toml
[functions.dhmad-create-escrow]
verify_jwt = true

[functions.dhmad-release-escrow]
verify_jwt = true

[functions.dhmad-refund-escrow]
verify_jwt = true

[functions.dhmad-get-escrow-status]
verify_jwt = true

[functions.dhmad-checkout-session]
verify_jwt = true
```

---

### Step 4: Deploy Edge Functions

Deploy all Dhmad Edge Functions to Supabase:

```bash
# Deploy all Dhmad functions
npx supabase functions deploy dhmad-create-escrow --project-ref YOUR_PROJECT_REF
npx supabase functions deploy dhmad-release-escrow --project-ref YOUR_PROJECT_REF
npx supabase functions deploy dhmad-refund-escrow --project-ref YOUR_PROJECT_REF
npx supabase functions deploy dhmad-get-escrow-status --project-ref YOUR_PROJECT_REF
npx supabase functions deploy dhmad-checkout-session --project-ref YOUR_PROJECT_REF
```

Or deploy all at once:

```bash
npx supabase functions deploy --project-ref YOUR_PROJECT_REF
```

---

### Step 5: Verify Secrets Are Set

Check that your secrets are properly configured:

```bash
npx supabase secrets list --project-ref YOUR_PROJECT_REF
```

You should see:
- `DHMAD_API_KEY`
- `DHMAD_BASE_URL`
- `ALLOWED_ORIGIN`
- `SUPABASE_URL` (auto-injected)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected)
- `SUPABASE_ANON_KEY` (auto-injected)

---

### Step 6: Test the Integration

#### Test in Development Mode

The code already has dev mode mocks, so you can test locally:

```bash
npm run dev
```

Navigate to a contract and try to create an escrow. It should work with mock data.

#### Test in Production

Once deployed, test with a real contract:

1. Create a contract between a client and freelancer
2. Client accepts the proposal
3. System creates Dhmad escrow
4. Client pays via Dhmad checkout URL
5. Freelancer completes work
6. Client approves and releases payment
7. Funds are released to freelancer

---

## 🔍 TROUBLESHOOTING

### Error: "DHMAD_API_KEY is not set"

**Solution**: Make sure you set the secret correctly:
```bash
npx supabase secrets set DHMAD_API_KEY="sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08" --project-ref YOUR_PROJECT_REF
```

### Error: "Failed to create escrow"

**Possible causes**:
1. API key is invalid or expired
2. Dhmad API endpoint changed
3. Request format doesn't match Dhmad's expected format

**Solution**: Check Dhmad documentation at https://docs.dhmad.tn

### Error: "CORS error"

**Solution**: Make sure `ALLOWED_ORIGIN` is set correctly:
```bash
npx supabase secrets set ALLOWED_ORIGIN="https://workedin.tn" --project-ref YOUR_PROJECT_REF
```

For local testing, you might need to add `http://localhost:5173` as well.

---

## 📊 MONITORING

### Check Edge Function Logs

View logs for debugging:

```bash
# View logs for a specific function
npx supabase functions logs dhmad-create-escrow --project-ref YOUR_PROJECT_REF

# Follow logs in real-time
npx supabase functions logs dhmad-create-escrow --project-ref YOUR_PROJECT_REF --follow
```

Or in the Supabase Dashboard:
1. Go to Edge Functions
2. Click on the function name
3. View "Logs" tab

---

## 🔐 SECURITY BEST PRACTICES

### ✅ DO:
- Keep API key secret (never commit to git)
- Use environment variables/secrets
- Validate all inputs in Edge Functions
- Check user authentication before creating escrows
- Log all escrow operations for audit trail

### ❌ DON'T:
- Never expose API key in frontend code
- Never commit `.env.local` to git
- Never skip authentication checks
- Never trust client-side data without validation

---

## 📝 NEXT STEPS

### Immediate:
- [ ] Find your Supabase project reference
- [ ] Set Dhmad secrets in Supabase
- [ ] Update `supabase/config.toml`
- [ ] Deploy Edge Functions
- [ ] Test in development mode

### This Week:
- [ ] Test with real contracts in production
- [ ] Monitor Edge Function logs
- [ ] Set up error alerting
- [ ] Document payment flow for users

### Future:
- [ ] Add webhook handling for Dhmad callbacks
- [ ] Implement dispute resolution flow
- [ ] Add payment analytics dashboard
- [ ] Optimize escrow creation flow

---

## 🎯 QUICK START COMMANDS

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference:

```bash
# 1. Set secrets
npx supabase secrets set DHMAD_API_KEY="sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08" --project-ref YOUR_PROJECT_REF
npx supabase secrets set DHMAD_BASE_URL="https://dhmad.tn/api/v1" --project-ref YOUR_PROJECT_REF
npx supabase secrets set ALLOWED_ORIGIN="https://workedin.tn" --project-ref YOUR_PROJECT_REF

# 2. Deploy functions
npx supabase functions deploy --project-ref YOUR_PROJECT_REF

# 3. Verify
npx supabase secrets list --project-ref YOUR_PROJECT_REF

# 4. Test
npm run dev
```

---

## 📞 SUPPORT

### Dhmad Support:
- Email: [email protected]
- Docs: https://docs.dhmad.tn
- Dashboard: https://dashboard.dhmad.tn

### Supabase Support:
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

**Status**: Ready to configure ✅  
**Next Action**: Set Supabase secrets and deploy Edge Functions  
**Estimated Time**: 15-30 minutes

