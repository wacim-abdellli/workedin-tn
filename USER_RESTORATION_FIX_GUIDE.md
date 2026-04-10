# User Restoration Fix Guide

## Problem
When admins archive users, their names are changed to "Deleted User" in the database. When reactivating, the original name doesn't restore because it was lost.

## Solution Implemented

### 1. Database Migration
A new migration has been created: `supabase/migrations/20260410180000_add_user_restoration_support.sql`

This migration adds:
- `original_full_name` column to store the name before archiving
- `original_email` column to store the email before archiving
- `archived_at` timestamp column
- `archive_user_account()` RPC function that preserves original data
- `restore_user_account()` RPC function that restores original data

### 2. Frontend Updates
Updated `src/pages/admin/UsersTab.tsx` to:
- Use `restore_user_account()` RPC when reactivating archived users
- Use `archive_user_account()` RPC when archiving users
- Fallback to manual methods if RPC functions don't exist yet

### 3. Contact Form Fix
Fixed `src/components/routing/AccountStatusGate.tsx`:
- Added click-outside-to-close functionality to the backdrop
- Removed console.log statement
- Modal now properly shows when "Contact support" button is clicked

## Steps to Apply

### Step 1: Apply the Migration to Supabase

Run this command in your terminal:

```bash
npx supabase db push
```

Or manually apply the migration in Supabase Dashboard:
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20260410180000_add_user_restoration_support.sql`
3. Paste and run it

### Step 2: Fix Existing Archived User "hajer ben rbeh"

Since this user was already archived without the backup columns, you need to manually restore their name.

Option A - Using Supabase Dashboard:
1. Go to Supabase Dashboard → Table Editor → profiles
2. Find the user with `full_name = 'Deleted User'` and email containing the user's info
3. Update the `full_name` field to `hajer ben rbeh`

Option B - Using SQL:
```sql
-- Find the user first
SELECT id, full_name, email, account_status 
FROM profiles 
WHERE email LIKE '%hajer%' OR full_name = 'Deleted User';

-- Update the specific user (replace <user_id> with actual ID)
UPDATE profiles 
SET full_name = 'hajer ben rbeh'
WHERE id = '<user_id>';
```

### Step 3: Test the Fix

1. In the admin dashboard, archive a test user
2. Verify their name changes to "Deleted User"
3. Reactivate the user
4. Verify their original name is restored

### Step 4: Test Contact Form

1. Log out or use incognito mode
2. Try to access the platform with a suspended/archived account
3. Click "Contact support" button
4. Verify the form appears
5. Click outside the form to verify it closes
6. Fill and submit the form to verify it works

## Future Archiving

From now on, when you archive users through the admin panel:
- Their original name and email will be automatically backed up
- When you reactivate them, their original data will be restored
- No manual intervention needed

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove the new columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS original_full_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS original_email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS archived_at;

-- Drop the functions
DROP FUNCTION IF EXISTS archive_user_account(UUID, TEXT);
DROP FUNCTION IF EXISTS restore_user_account(UUID, TEXT);
```
