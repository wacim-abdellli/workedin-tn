# Quick Start Guide - User Restoration & Contact Form Fixes

## What Was Fixed

✅ User names now restore properly when reactivating archived accounts
✅ Contact support form now shows and works on suspended/archived account pages
✅ Code is ready to use - just need to apply database changes

## How to Apply the Fix

### Option 1: Copy & Paste SQL (Easiest)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open the file `APPLY_RESTORATION_FIX.sql` in this project
4. Copy all the SQL code
5. Paste it into Supabase SQL Editor
6. Click "Run"
7. Done! ✅

### Option 2: Use Migration Command (If you want to fix the migration error first)

The `npx supabase db push` command failed because of duplicate migration files. I've cleaned those up, but the database still has a conflict. See `MIGRATION_FIX_INSTRUCTIONS.md` for details.

## Fix the Existing User "hajer ben rbeh"

After applying the SQL above, run this in Supabase SQL Editor:

```sql
-- Find the user
SELECT id, full_name, email, account_status 
FROM profiles 
WHERE full_name = 'Deleted User';

-- Copy the user's ID from the result, then run:
UPDATE profiles 
SET full_name = 'hajer ben rbeh' 
WHERE id = 'PASTE_USER_ID_HERE';
```

## Test Everything

### Test User Restoration
1. Go to Admin Dashboard → Users
2. Archive a test user
3. Verify name changes to "Deleted User"
4. Reactivate the user
5. Verify original name is restored ✅

### Test Contact Form
1. Log out (or use incognito mode)
2. Try to access the platform with a suspended account
3. Click "Contact support" button
4. Verify form appears ✅
5. Click outside form to verify it closes ✅
6. Fill and submit form to verify it works ✅

## Files Changed

- `src/pages/admin/UsersTab.tsx` - Uses new restoration functions
- `src/components/routing/AccountStatusGate.tsx` - Fixed contact form
- `supabase/migrations/20260410180000_add_user_restoration_support.sql` - Database changes

## Need Help?

See these detailed guides:
- `MIGRATION_FIX_INSTRUCTIONS.md` - If you want to use `npx supabase db push`
- `USER_RESTORATION_FIX_GUIDE.md` - Complete technical documentation
- `FIXES_APPLIED.md` - Summary of all changes made
