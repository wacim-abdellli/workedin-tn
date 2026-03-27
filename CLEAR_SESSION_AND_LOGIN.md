# SOLUTION: Clear Corrupted Session

The issue is that `supabase.auth.getSession()` is hanging. This happens when:
- The session token is corrupted
- The token refresh is stuck in a loop
- localStorage has bad data

## Fix: Clear localStorage and re-login

### Option 1: Browser Console (Fastest)
Open browser console (F12) and run:

```javascript
// Clear all Supabase session data
Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));

// Reload the page
location.reload();
```

Then sign in again.

### Option 2: Manual
1. Open DevTools (F12)
2. Go to Application tab → Local Storage
3. Find all keys starting with `sb-` and delete them
4. Reload the page
5. Sign in again

### Option 3: Incognito/Private Window
1. Open an incognito/private browser window
2. Go to your site
3. Sign in
4. Try the admin dashboard

## Why This Happens

The Supabase client is configured with `autoRefreshToken: true`, which means it tries to automatically refresh expired tokens. If the token is corrupted or the refresh endpoint is not responding, `getSession()` hangs indefinitely waiting for the refresh to complete.

## After Clearing

Once you clear the session and sign in fresh:
1. You'll get a new, clean JWT token
2. The `is_admin` flag will be included (from the database)
3. All admin queries should work

## If It Still Doesn't Work

If clearing the session doesn't fix it, the issue might be:
1. Network connectivity to Supabase
2. Supabase project is down/suspended
3. The anon key is invalid

Check Supabase dashboard to verify your project is active.
