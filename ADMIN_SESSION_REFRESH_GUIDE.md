# Admin Session Refresh Guide

## Current Situation

✅ **SQL Fix Applied Successfully**
- The `FIX_ADMIN_RLS.sql` has been executed
- RLS policies are now in place with the `is_admin()` function
- Database recognizes your account as admin (`is_admin = true` in profiles table)

❌ **Session Token Not Updated**
- Your browser has a cached JWT token with old data (`is_admin = false`)
- The admin dashboard shows: "Admin panel access is enabled, but database admin privileges are not fully enabled"
- Users and Jobs tabs show: "Failed to load users/jobs"

## Why This Happens

When you log in, Supabase creates a JWT (JSON Web Token) that contains your user data, including the `is_admin` flag. This token is cached in your browser and used for all subsequent requests.

Even though the database now has `is_admin = true` for your account, your browser is still using the OLD token that has `is_admin = false`.

The RLS policies check the database directly using `is_admin()` function, so they correctly block access until you get a fresh token.

## Solution: Refresh Your Session

Choose ONE of these methods:

### Method 1: Sign Out and Sign Back In (Recommended - Simplest)

1. Click your profile menu in the top right
2. Click "Sign Out"
3. Sign back in with your credentials
4. Navigate to `/admin`
5. ✅ Everything should work now!

### Method 2: Use Browser Console (Fastest)

1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to the "Console" tab
3. Paste this code and press Enter:

```javascript
await window.supabase.auth.refreshSession();
location.reload();
```

4. ✅ Page will reload with fresh admin access!

### Method 3: Use the Refresh Helper Page

1. Open `refresh-admin-session.html` in your browser
2. Click the "Refresh Session & Reload" button
3. ✅ You'll be redirected to the admin dashboard

### Method 4: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Sign out and sign back in
5. ✅ Fresh session loaded!

## Verification

After refreshing your session, you should see:

✅ **Warning banner disappears** - No more "database admin privileges are not fully enabled" message
✅ **Users tab loads** - Shows list of users with search and filters
✅ **Jobs tab loads** - Shows list of jobs with status filters
✅ **Verifications tab loads** - Shows pending identity verification requests
✅ **Disputes tab loads** - Shows open disputes

## Troubleshooting

### Still seeing "Failed to load" errors?

1. **Check your email in the database:**
   ```sql
   SELECT id, email, is_admin FROM profiles WHERE email = 'your-email@example.com';
   ```
   Make sure `is_admin` is `true`

2. **Verify the RLS function exists:**
   ```sql
   SELECT is_admin();
   ```
   Should return `true` if you're logged in as admin

3. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   Should show policies using `is_admin()`

4. **Force session refresh in Supabase:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your user
   - Click "..." → "Reset Password"
   - Use the reset link to set a new password
   - This forces a complete session refresh

### Still having issues?

The problem might be:
- Your account email doesn't match what's in the database
- The SQL wasn't run with the correct user context
- RLS policies have syntax errors

Run this diagnostic query:
```sql
-- Check your current session
SELECT 
  auth.uid() as my_user_id,
  auth.email() as my_email,
  is_admin() as am_i_admin,
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) as db_is_admin;
```

Expected result:
- `my_user_id`: Your UUID
- `my_email`: Your email
- `am_i_admin`: `true`
- `db_is_admin`: `true`

If `am_i_admin` is `false` but `db_is_admin` is `true`, you need to refresh your session.

## Next Steps

Once your session is refreshed and the admin dashboard is working:

1. ✅ Test all tabs (Users, Jobs, Verifications, Disputes)
2. ✅ Verify you can see data in each tab
3. ✅ Test admin actions (approve verification, resolve dispute, etc.)
4. ✅ Move on to the next feature or task

## Technical Details

### JWT Token Structure

Your JWT contains claims like:
```json
{
  "sub": "user-uuid",
  "email": "your-email@example.com",
  "is_admin": false,  // ← This is cached!
  "exp": 1234567890
}
```

After refresh:
```json
{
  "sub": "user-uuid",
  "email": "your-email@example.com",
  "is_admin": true,   // ← Updated!
  "exp": 1234567890
}
```

### RLS Policy Logic

The `is_admin()` function bypasses RLS using `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  -- ← Runs with elevated privileges
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;
```

This prevents infinite recursion because the function itself doesn't trigger RLS policies.

---

**Need help?** Check the browser console for error messages or run the diagnostic queries above.
