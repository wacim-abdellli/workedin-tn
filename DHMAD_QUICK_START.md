# Dhmad.tn Quick Start - 5 Minutes Setup

## Your API Key
```
sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08
```

## Step 1: Find Your Supabase Project Reference

Look at your `.env.local` file and find `VITE_SUPABASE_URL`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
```

The `YOUR_PROJECT_REF` part is what you need.

## Step 2: Run Setup Script

### On Windows (PowerShell):
```powershell
.\scripts\setup-dhmad.ps1 YOUR_PROJECT_REF
```

### On Mac/Linux (Bash):
```bash
chmod +x scripts/setup-dhmad.sh
./scripts/setup-dhmad.sh YOUR_PROJECT_REF
```

## Step 3: Done! 🎉

The script will:
- ✅ Set your Dhmad API key as a Supabase secret
- ✅ Configure the Dhmad base URL
- ✅ Deploy all 5 Dhmad Edge Functions
- ✅ Verify everything is working

## Manual Setup (If Script Fails)

If the script doesn't work, do it manually:

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

## Test It

1. Start your dev server: `npm run dev`
2. Create a contract between a client and freelancer
3. Accept the proposal
4. The system will create a Dhmad escrow automatically
5. Check the console for logs

## Troubleshooting

### "Project ref not found"
- Make sure you're using the correct project reference
- Check your `.env.local` file

### "Secrets not set"
- Run the setup script again
- Or set them manually using the commands above

### "Edge Functions not deployed"
- Make sure you have Supabase CLI installed: `npm install -g supabase`
- Login to Supabase: `npx supabase login`
- Try deploying again

## Need Help?

See the full guide: `DHMAD_SETUP_GUIDE.md`

---

**That's it!** Your Dhmad integration is ready. 🚀
