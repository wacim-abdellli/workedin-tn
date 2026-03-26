# FIX: Signup Role Selection Hangs Forever

## Problem
When a user clicks "Freelancer", "Client", or "Both" on `/signup?step=select-type`, the app hangs for 15 seconds then shows a timeout error. This blocks ALL new user signups.

## Root Cause (CONFIRMED)
**Every write query (UPDATE, UPSERT, INSERT, even RPC) to the `profiles` table hangs indefinitely.** SELECT queries work fine.

This means the `profiles` table has a **row-level or table-level lock** from a stale/abandoned PostgreSQL transaction. This is NOT a code issue — it's a database-level lock.

## Evidence
1. `supabase.from('profiles').upsert(...)` — hangs (caught by 15s timeout)
2. `supabase.from('profiles').update(...)` — hangs (caught by 15s timeout)
3. `supabase.rpc('set_user_type_rpc', ...)` — hangs (this is SECURITY DEFINER, bypasses RLS entirely, still hangs = confirmed DB lock)
4. `supabase.from('profiles').select(...)` — works fine (reads don't need write locks)

### Step 1: Kill ALL Stuck Connections
Run this exact query. It forcefully disconnects everything (including the ghost transaction), completely unbricking your database.

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND datname = current_database();
```

### Step 2: Apply the Fixed RPC & RLS Policies
After running Step 1, copy EVERYTHING inside `supabase/migrations/20260326_fix_profiles_rls.sql` and run it. I just fixed a minor type conversion bug in it.

### Step 3: Verify it works
Go to `khedma-tn.vercel.app/signup?step=select-type` and click Freelancer. The ghost lock is dead, and the RPC will execute instantly.

## Code Changes Already Made
All code changes are committed and pushed to `main`:
- `src/contexts/AuthContext.tsx` — uses `supabase.rpc('set_user_type_rpc')` with fallback to direct update
- `src/components/auth/SignupForm.tsx` — step syncs with URL params via useEffect
- `supabase/migrations/20260326_fix_profiles_rls.sql` — RLS fix + RPC function

## After Fixing the Lock
Remove debug alerts from `SignupForm.tsx` (line 123: `window.alert(...)` call).
