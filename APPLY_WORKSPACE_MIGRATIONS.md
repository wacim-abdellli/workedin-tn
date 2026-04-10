# Apply Workspace-Scoped Architecture Migrations

## Overview
This guide will help you apply the database migrations needed for workspace-scoped profiles and messaging (client vs freelancer mode separation).

## Prerequisites
- Access to Supabase Dashboard: https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd
- Admin access to your Supabase project

---

## Step 1: Apply Database Migrations

### Option A: Using Supabase Dashboard (Recommended if CLI not installed)

1. **Go to SQL Editor**
   - Open: https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd/sql/new
   
2. **Apply Migration 1: Expand Onboarding Profile Fields**
   - Copy the entire content from: `supabase/migrations/20260410103000_expand_onboarding_profile_fields.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success confirmation

3. **Apply Migration 2: Fix Notification Overload**
   - Copy the entire content from: `supabase/migrations/20260410114000_fix_set_user_account_status_notification_overload.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success confirmation

4. **Apply Migration 3: Workspace-Scoped Conversations and Mode Avatars**
   - Copy the entire content from: `supabase/migrations/20260410132000_workspace_scoped_conversations_and_mode_avatars.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success confirmation

### Option B: Using Supabase CLI (If installed)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
supabase link --project-ref wvgkezmboewtlpnyjnyd

# Apply all pending migrations
supabase db push
```

---

## Step 2: Deploy Updated Edge Function

### Option A: Using Supabase Dashboard

1. **Go to Edge Functions**
   - Open: https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd/functions

2. **Update secure-upload function**
   - Find the `secure-upload` function
   - Click "Edit"
   - Copy the entire content from: `supabase/functions/secure-upload/index.ts`
   - Paste and save
   - Deploy the function

### Option B: Using Supabase CLI

```bash
supabase functions deploy secure-upload
```

---

## Step 3: Verify the Changes

### Check Database Schema

Run this query in SQL Editor to verify the new columns exist:

```sql
-- Check profiles table for new avatar columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('avatar_url_client', 'avatar_url_freelancer');

-- Check conversations table for scope column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations' 
  AND column_name = 'conversation_scope';

-- Check if get_or_create_conversation function has new signature
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_or_create_conversation'
  AND routine_schema = 'public';
```

Expected results:
- `avatar_url_client` and `avatar_url_freelancer` columns should exist in `profiles`
- `conversation_scope` column should exist in `conversations`
- `get_or_create_conversation` function should be listed

### Test Mode Switching

1. **Login to your app**
2. **Switch between Client and Freelancer modes**
3. **Check that:**
   - Avatar changes are mode-specific
   - Messages are properly scoped
   - No errors in browser console

---

## Step 4: Monitor for Issues

### Check for Errors

1. **Browser Console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Look for any Supabase-related errors

2. **Supabase Logs**
   - Go to: https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd/logs/explorer
   - Filter by "error" level
   - Check for any migration-related issues

### Common Issues and Solutions

**Issue: "column does not exist"**
- Solution: Migration didn't apply correctly. Re-run the migration in SQL Editor.

**Issue: "function does not exist"**
- Solution: The RPC function wasn't created. Re-run migration 3.

**Issue: "permission denied"**
- Solution: Check RLS policies. The migrations should have set correct permissions.

---

## What These Migrations Do

### Migration 1: Expand Onboarding Profile Fields
- Adds company-related fields for client profiles
- Adds experience and portfolio fields for freelancer profiles
- Enables richer onboarding data collection

### Migration 2: Fix Notification Overload
- Resolves ambiguous function overload in admin status updates
- Fixes notification creation conflicts
- Ensures admin actions trigger proper notifications

### Migration 3: Workspace-Scoped Conversations and Mode Avatars
- Adds `avatar_url_client` and `avatar_url_freelancer` columns to profiles
- Adds `conversation_scope` column to conversations
- Updates `get_or_create_conversation` function to handle workspace scoping
- Creates indexes for efficient workspace-filtered queries
- Migrates existing contract conversations to 'contract' scope

---

## Rollback (If Needed)

If something goes wrong, you can rollback by running:

```sql
-- Rollback Migration 3
ALTER TABLE public.conversations DROP COLUMN IF EXISTS conversation_scope;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url_client;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url_freelancer;

-- Rollback Migration 1
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company_website;
-- ... (drop other columns as needed)
```

---

## Next Steps After Migration

1. **Test workspace switching thoroughly**
2. **Verify avatar uploads work for both modes**
3. **Check message filtering by workspace**
4. **Implement Phase 2 features** (if needed):
   - Fully strict role-separated inbox views
   - Contract tab split by role
   - Role-specific public avatar rendering everywhere

---

## Support

If you encounter issues:
1. Check Supabase logs
2. Check browser console
3. Verify migrations applied successfully
4. Check the WORKSPACE_PROFILE_MESSAGING_MAP.md for architecture details
