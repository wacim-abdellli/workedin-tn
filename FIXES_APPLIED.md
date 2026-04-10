# Fixes Applied - User Restoration & Contact Form

## Issues Fixed

### 1. User Name Not Restoring After Reactivation ✅
- Problem: When archiving users, their name changed to "Deleted User" and didn't restore when reactivated
- Solution: 
  - Created database migration with backup columns (`original_full_name`, `original_email`, `archived_at`)
  - Added `archive_user_account()` RPC function to preserve original data
  - Added `restore_user_account()` RPC function to restore original data
  - Updated frontend to use new RPC functions with fallback support

### 2. Contact Support Form Not Showing ✅
- Problem: Clicking "Contact support" button on suspended/archived account pages didn't show the form
- Solution:
  - Added click handler to backdrop to close modal
  - Removed debug console.log
  - Fixed event propagation to prevent backdrop clicks from closing when clicking inside form

## Files Modified

1. `src/pages/admin/UsersTab.tsx`
   - Updated `setUserStatusMutation` to use `restore_user_account()` RPC
   - Updated `deleteUserMutation` to use `archive_user_account()` RPC
   - Added fallback logic for backward compatibility

2. `src/components/routing/AccountStatusGate.tsx`
   - Fixed modal backdrop click-to-close functionality
   - Cleaned up button click handler

3. `supabase/migrations/20260410180000_add_user_restoration_support.sql`
   - Already exists, ready to be applied

## Next Steps

### Required: Apply Database Migration

Run this command:
```bash
npx supabase db push
```

Or apply manually in Supabase Dashboard SQL Editor.

### Required: Fix Existing User "hajer ben rbeh"

Since this user was archived before the migration, manually update their name:

```sql
-- Find the user
SELECT id, full_name, email FROM profiles WHERE full_name = 'Deleted User';

-- Update (replace <user_id> with actual ID)
UPDATE profiles SET full_name = 'hajer ben rbeh' WHERE id = '<user_id>';
```

### Testing

1. Test user archiving and restoration with a test account
2. Test contact form on suspended/archived account pages
3. Verify clicking outside form closes it
4. Verify form submission works

## Technical Details

The solution uses a two-tier approach:
1. Primary: New RPC functions that atomically backup and restore user data
2. Fallback: Manual update logic for backward compatibility

This ensures the system works even if migrations haven't been applied yet, while providing the best experience when they have been.
