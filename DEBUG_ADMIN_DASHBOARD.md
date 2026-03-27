# Debug Admin Dashboard - Step by Step

## Step 1: Run the SQL Fix

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" on the left
4. Copy and paste the entire content of `FIX_ADMIN_RLS_POLICIES.sql`
5. **IMPORTANT:** Change `wacimabdelli01@gmail.com` to YOUR email (appears twice in the file)
6. Click "Run" or press Ctrl+Enter
7. You should see results showing:
   - Your user with `is_admin = true`
   - `am_i_admin = true`
   - Record counts (numbers, not zeros)

## Step 2: Check Browser Console

1. Open your app at `localhost:5173/admin`
2. Press F12 to open Developer Tools
3. Click the "Console" tab
4. Look for any red error messages
5. Take a screenshot or copy the errors

## Step 3: Test the is_admin Function

Run this in Supabase SQL Editor:

```sql
-- Test 1: Check your user
SELECT id, email, is_admin 
FROM public.profiles 
WHERE email = 'YOUR_EMAIL_HERE';

-- Test 2: Check if function works
SELECT public.is_admin() as result;

-- Test 3: Try to count profiles
SELECT COUNT(*) FROM public.profiles;
```

## Step 4: Clear Your Session

Sometimes the old session is cached:

1. In your app, open Developer Tools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Find "Local Storage" → `localhost:5173`
4. Delete all items that start with `sb-`
5. Refresh the page
6. Log in again

## Step 5: Check Network Requests

1. Open Developer Tools (F12)
2. Go to "Network" tab
3. Refresh the admin dashboard
4. Look for requests to Supabase
5. Click on any failed requests (red ones)
6. Check the "Response" tab to see the error

## Common Issues and Fixes

### Issue 1: "new row violates row-level security policy"
**Fix:** Run the `FIX_ADMIN_RLS_POLICIES.sql` file

### Issue 2: "permission denied for table profiles"
**Fix:** Make sure RLS is enabled:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
```

### Issue 3: Still showing zeros after SQL
**Fix:** 
1. Log out of your app
2. Clear browser cache (Ctrl+Shift+Delete)
3. Log back in
4. Try again

### Issue 4: "is_admin is null"
**Fix:**
```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'YOUR_EMAIL_HERE';
```

## What to Send Me

If it's still not working, send me:

1. Screenshot of the browser console errors
2. Result of this SQL query:
```sql
SELECT id, email, is_admin, created_at
FROM public.profiles
WHERE email = 'YOUR_EMAIL_HERE';
```
3. Result of this SQL query:
```sql
SELECT public.is_admin();
```
4. Any error messages from the Network tab

I'll help you fix it!
