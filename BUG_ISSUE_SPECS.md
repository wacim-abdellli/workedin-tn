# BUG #1: Admin Cannot Revoke Identity Verification

**Status**: DIAGNOSED ✅  
**Severity**: HIGH (Admin functionality broken)  
**Date Found**: April 2, 2026

---

## Bug Description

When an admin clicks the "Revoke Verification" button on the Admin Dashboard for a user with verified identity, the operation fails with error message: **"Unable to revoke verification"**

### Steps to Reproduce
1. Navigate to Admin Dashboard (`/admin`)
2. Go to Users Tab
3. Find a user with `Verified` status (green checkmark)
4. Click the revoke button (trash/shield icon)
5. Confirm the action in the modal dialog
6. **Expected**: Verification is removed, success message shown
7. **Actual**: Error toast appears: "Unable to revoke verification"

### Error Evidence
- Toast message: "Unable to revoke verification"
- Modal title: "Unable to revoke verification"
- User can see the "Revoke Verification" modal but it fails on confirm

---

## Root Cause Analysis

### The Problem

The RLS (Row Level Security) policy for deleting identity_verifications is too restrictive:

**File**: `supabase/migrations/20260326100000_create_identity_verifications.sql` (Line 28)

```sql
CREATE POLICY "identity_verifications_delete" ON identity_verifications
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');
```

**Issue**: The policy only allows deletion if:
1. The current user is the identity_verification owner (`auth.uid() = user_id`)
2. AND the status is 'pending'

**But when admin tries to delete**:
- Admin's `auth.uid()` ≠ the user's `user_id` (admin != user)
- The verification status is 'approved', not 'pending'
- RLS policy blocks the delete → Error

### Why This Happens

The RLS policy was designed for **users to cancel their own pending verifications**, not for admins to revoke approved ones. There's no policy allowing admins to delete any identity_verification record.

---

## Current Code Flow

### Admin Code Attempting Delete
**File**: `src/pages/admin/UsersTab.tsx` (Lines 177-180)

```typescript
supabase
    .from('identity_verifications')
    .delete()
    .eq('user_id', user.id),  // ← This query fails due to RLS
```

### RLS Policy Blocking It
**File**: `supabase/migrations/20260326100000_create_identity_verifications.sql`

```sql
-- Users can delete their own pending verification (to resubmit)
CREATE POLICY "identity_verifications_delete" ON identity_verifications
    FOR DELETE USING (
        auth.uid() = user_id         -- ❌ FAILS: admin.uid ≠ user.id
        AND status = 'pending'        -- ❌ FAILS: status is 'approved', not 'pending'
    );
    -- ❌ NO POLICY FOR ADMINS!
```

---

## Solution Required

### Add Admin Delete Policy

Add a new RLS policy to allow admins to delete identity_verifications:

**File to Update**: `supabase/migrations/20260326100000_create_identity_verifications.sql`

**After line 28, add**:

```sql
-- Admins can delete any verification (for revocation)
CREATE POLICY "identity_verifications_delete_admin" ON identity_verifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );
```

**Alternative (More Efficient)**: Use a bypass approach if admin bypass RLS is enabled:

```sql
-- Admins can delete any verification (for revocation)
CREATE POLICY "identity_verifications_delete_admin" ON identity_verifications
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'authenticated'
        AND (
            -- Users deleting their own pending
            (auth.uid() = user_id AND status = 'pending')
            -- OR admins deleting any
            OR (SELECT is_admin FROM profiles WHERE profiles.id = auth.uid())
        )
    );
```

---

## Files Affected

### Primary Files
1. **`supabase/migrations/20260326100000_create_identity_verifications.sql`**
   - Location of buggy RLS policy
   - Need to add admin delete policy

2. **`src/pages/admin/UsersTab.tsx`** (Lines 177-180)
   - Admin deletion code (this is correct, just blocked by RLS)
   - No code changes needed once RLS is fixed

### Related Files to Verify After Fix
- `HOTFIX_IDENTITY_VERIFICATIONS_RLS.sql` (if exists, may need update)
- `FIX_ADMIN_RLS.sql` (if exists, may need update)
- Any other migration files with identity_verifications policies

---

## Verification Steps

After implementing the fix:

1. **Deploy migration** to Supabase
2. **Test in admin dashboard**:
   - Navigate to `/admin`
   - Find a verified user
   - Click revoke button
   - Click confirm
   - ✅ Should show success: "Verification revoked successfully"
   - ✅ User verification status should change to "Unverified"

3. **Verify data changes**:
   ```sql
   -- Check profile was updated
   SELECT id, cin_verified, cin_submitted FROM profiles 
   WHERE id = '<test-user-id>';
   
   -- Should show: cin_verified=false, cin_submitted=false
   
   -- Check identity_verifications record deleted
   SELECT * FROM identity_verifications 
   WHERE user_id = '<test-user-id>';
   
   -- Should show: no records (empty result)
   ```

4. **Verify notification sent**:
   ```sql
   SELECT * FROM notifications 
   WHERE user_id = '<test-user-id>' 
   AND type = 'identity_rejected'
   ORDER BY created_at DESC LIMIT 1;
   
   -- Should show: recent notification with type 'identity_rejected'
   ```

---

## Impact

- **Severity**: HIGH (admin feature completely broken)
- **Affected Users**: Admins trying to revoke identity verifications
- **Frequency**: Every time admin tries to revoke any verification
- **User Impact**: Cannot manage user verification status, security issue if fraudulent users need to be revoked

---

## Additional Notes

### Similar Issue Pattern
This same RLS issue likely affects other admin revocation operations. Check:
- Other admin delete operations in database
- Ensure all admin tables have appropriate RLS policies
- Verify admin role is properly checked in all policies

### Security Consideration
- The fix allows admins to delete ANY identity_verification record
- This is intentional for admin revocation capability
- Ensure only legitimate admins have access (enforce via auth)
- Consider adding audit logging for admin revocations

---

## Summary

**Problem**: RLS policy `identity_verifications_delete` only allows users to delete their own PENDING verifications, not admins revoking APPROVED ones

**Root Cause**: Missing admin delete policy in RLS

**Fix**: Add new RLS policy allowing admins to delete any identity_verification record

**Testing**: Verify admin can revoke, profile is updated, and notification is sent

---

**Prepared for**: AI Agent Fix Implementation  
**Ready to Fix**: Yes ✅
