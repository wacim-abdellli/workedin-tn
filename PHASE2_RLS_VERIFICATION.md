# PHASE 2: RLS & SECURITY VERIFICATION
**Status:** Ready for testing in Supabase

---

## Tests to Run in Supabase SQL Editor

### 1. RLS Status Check
```sql
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE WHEN rowsecurity THEN '✅ Protected' ELSE '❌ EXPOSED' END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled ASC, tablename;
```
**Expected:** All tables should show `rls_enabled = true`

---

### 2. Public Access Test (as anon)
Test if anonymous users can:
```sql
-- Should return open jobs
SELECT COUNT(*) FROM jobs WHERE status = 'open' AND visibility = 'public';

-- Should return 0 (profiles should be protected)
SELECT COUNT(*) FROM profiles;
```

---

### 3. Authenticated Access Test
Test if logged-in users can:
```sql
-- Users should see their own profile
-- SELECT * FROM profiles WHERE id = auth.uid();

-- Freelancers should see their own proposals
-- SELECT COUNT(*) FROM proposals WHERE freelancer_id = auth.uid();

-- Clients should see their own jobs
-- SELECT COUNT(*) FROM jobs WHERE client_id = auth.uid();
```

---

### 4. Admin Access Test
Test if admin user can see all data:
```sql
-- Run as admin user (your account)
SELECT COUNT(*) FROM profiles;  -- Should be > 0
SELECT COUNT(*) FROM jobs;      -- Should be > 0
SELECT COUNT(*) FROM proposals; -- Should be > 0
SELECT COUNT(*) FROM contracts; -- Should be > 0
```

---

## Current RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Owner + Admin | Owner | Owner + Admin | Owner |
| jobs | Public + Owner + Admin | Auth | Owner | Owner |
| proposals | Owner + Job Owner | Auth | Owner + Job Owner | Owner |
| contracts | Parties + Admin | - | - | - |
| wallets | Owner + Admin | - | Owner | - |
| portfolio_items | Public + Owner | Owner | Owner | Owner |
| notifications | Owner | - | Owner | - |
| reviews | Public | Auth | - | - |
| disputes | Parties + Admin | Auth | Parties + Admin | - |

---

## Manual Testing Checklist

- [ ] Visit job board as anonymous user - jobs visible?
- [ ] Visit job board as logged-in freelancer - jobs visible?
- [ ] Submit a proposal as freelancer - works?
- [ ] Post a job as client - works?
- [ ] View admin dashboard as admin - all stats show data?
- [ ] Test wallet connect as regular user

---

## If Issues Found

Run the diagnostic in `supabase/AUDIT_RLS.sql` to identify problems.

For admin issues, re-run `supabase/migrations/20260329_admin_dashboard_fixes.sql`
