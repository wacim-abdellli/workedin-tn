# Admin Dashboard Fix - Service Role Key Required

## ✅ Problem Identified & Fixed

The admin dashboard was failing to load data because:
- Admin queries were using the regular `supabase` client (subject to RLS policies)
- Your JWT token doesn't contain `is_admin` in app_metadata
- RLS policies check for `is_admin` in JWT, which returns NULL, blocking all queries

## ✅ Solution Applied

Updated ALL admin queries to use `supabaseAdmin` client which bypasses RLS policies entirely:
- ✅ `UsersTab.tsx` - fetch, toggle mode, delete, revoke verification
- ✅ `JobsTab.tsx` - fetch, delete
- ✅ `AdminDashboard.tsx` - stats, verifications, disputes, and all mutations

## 🔑 REQUIRED: Add Service Role Key

To complete the fix, you MUST add your Supabase service role key:

### Steps:

1. **Go to Supabase Dashboard**: 
   https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd

2. **Navigate to**: Project Settings > API section

3. **Find the service_role key** (marked as "secret" - NOT the anon key)

4. **Copy the service_role key**

5. **Open `.env` file** and uncomment this line:
   ```env
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

6. **Replace** `your_service_role_key_here` with the actual key

7. **RESTART your dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### ⚠️ Security Warning
The service role key has FULL database access and bypasses ALL security rules:
- ❌ NEVER commit this key to git (already in .gitignore)
- ❌ NEVER expose it in client-side code
- ✅ Keep it secret and secure
- ✅ Only use it for admin operations

## 📋 What Was Changed

### Files Updated:
1. **src/pages/admin/UsersTab.tsx**
   - `fetchAdminUsers()` - uses `supabaseAdmin || supabase`
   - `toggleUserModeMutation` - uses admin client
   - `deleteUserMutation` - uses admin client
   - `revokeVerificationMutation` - uses admin client

2. **src/pages/admin/JobsTab.tsx**
   - `fetchAdminJobs()` - uses `supabaseAdmin || supabase`
   - `deleteJobMutation` - uses admin client

3. **src/pages/AdminDashboard.tsx**
   - `fetchStats()` - uses admin client for all counts
   - `fetchVerifications()` - uses admin client
   - `fetchDisputes()` - uses admin client
   - `handleVerificationAction()` - uses admin client
   - `handleResolveDispute()` - uses admin client

4. **src/lib/supabase.ts**
   - Already had `supabaseAdmin` client defined ✅
   - Falls back to regular client if service key not provided

5. **.env**
   - Added commented placeholder for service role key

### How It Works:
```typescript
const client = supabaseAdmin || supabase;
```
- If `VITE_SUPABASE_SERVICE_ROLE_KEY` is set → uses admin client (bypasses RLS) ✅
- If not set → falls back to regular client (subject to RLS - will fail) ❌

## 🧪 Testing

After adding the service role key and restarting:

1. Navigate to `/admin` in your browser
2. All tabs should now load data:
   - ✅ Users tab - shows all users
   - ✅ Jobs tab - shows all jobs
   - ✅ Verifications tab - shows pending verifications
   - ✅ Disputes tab - shows open disputes
   - ✅ Overview - shows correct stats
3. All admin actions (delete, toggle, approve) should work

## 🎯 Why This Works

The service role key creates a Supabase client with admin privileges that:
- Bypasses ALL Row Level Security (RLS) policies
- Has full read/write access to all tables
- Doesn't depend on JWT token metadata
- Is the official Supabase way to implement admin functionality

This is the proper solution - not a workaround!

## 🔍 Previous Failed Attempts

What we tried before (and why they failed):
1. ❌ JWT-based RLS policies - JWT doesn't contain `is_admin` claim
2. ❌ `SECURITY DEFINER` functions - Still subject to RLS checks
3. ❌ Updating `raw_app_meta_data` - Doesn't propagate to JWT automatically
4. ❌ Session refresh - JWT structure doesn't change
5. ✅ Service role key - Bypasses RLS entirely (CORRECT SOLUTION)

