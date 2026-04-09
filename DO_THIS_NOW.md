# ⚡ DO THIS NOW - Dhmad Setup (2 Minutes)

## Your Info:
- **Supabase Project**: `wvgkezmboewtlpnyjnyd`
- **API Key**: `sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08`

---

## Step 1: Open PowerShell in Your Project

1. Open PowerShell (not CMD)
2. Navigate to your project:
   ```powershell
   cd C:\Users\pc\Desktop\khedma-tn
   ```

---

## Step 2: Run This ONE Command

Copy and paste this EXACT command:

```powershell
.\scripts\setup-dhmad.ps1 wvgkezmboewtlpnyjnyd
```

Press Enter and wait. It will:
- ✅ Configure your Dhmad API key
- ✅ Deploy payment functions
- ✅ Make payments work

---

## Step 3: Done! 🎉

That's it. Your payment system is now configured.

---

## If You Get an Error

If the script doesn't work, run these commands ONE BY ONE:

```powershell
# Command 1: Set API Key
npx supabase secrets set DHMAD_API_KEY="sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08" --project-ref wvgkezmboewtlpnyjnyd

# Command 2: Set Base URL
npx supabase secrets set DHMAD_BASE_URL="https://dhmad.tn/api/v1" --project-ref wvgkezmboewtlpnyjnyd

# Command 3: Set Allowed Origin
npx supabase secrets set ALLOWED_ORIGIN="https://workedin.tn" --project-ref wvgkezmboewtlpnyjnyd

# Command 4: Deploy Functions
npx supabase functions deploy --project-ref wvgkezmboewtlpnyjnyd
```

---

## What This Does

This configures your payment system so:
- Clients can pay for contracts
- Money is held in escrow (safe)
- Freelancers get paid when work is done
- Everything is automatic

---

## Need Help?

If you get stuck, tell me the error message and I'll help you fix it.

---

**Just run the command and you're done!** 🚀
