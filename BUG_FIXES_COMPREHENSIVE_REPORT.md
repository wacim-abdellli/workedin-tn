# Comprehensive Bug Fixes Report - BUG #2, #3, #4

**Session**: Bug Hunt #2  
**Date**: April 2, 2026  
**Status**: All bugs diagnosed, ready for implementation  
**Total Bugs**: 3 interconnected bugs with 4 code locations to fix

---

## Executive Summary

Three bugs found in the admin revoke verification flow and dashboard cache management:

| Bug # | Title | Severity | Status |
|-------|-------|----------|--------|
| #2 | Error Toast Shows Despite Success | MEDIUM | Diagnosed - Ready to Fix |
| #3 | No Notification Sent to Revoked User | MEDIUM | Diagnosed - Ready to Fix |
| #4 | Dashboard Shows Stale Data on First Load | MEDIUM | Diagnosed - Ready to Fix |

---

# BUG #2 & #3: Revoke Verification - Error Toast & Missing Notification

## Overview

**Related Bugs**: BUG #2 and BUG #3 (interconnected in same code flow)  
**Files Affected**: `src/pages/admin/UsersTab.tsx` (primary)  
**Total Changes Needed**: 3 fixes in 1 file

---

### BUG #2: Error Toast Shown Even When Successful

#### Symptoms
- Admin revokes verification successfully (data IS deleted from database)
- BUT error toast appears: **"Unable to revoke verification"**
- User sees failure message despite operation succeeding
- Confusing UX (success + error simultaneously)

#### Root Cause
**File**: `src/pages/admin/UsersTab.tsx` **Lines**: 191-192

The error handling checks ALL operations including non-critical ones:

```typescript
// Current broken code:
const firstError = results.find(r => r.error);
if (firstError?.error) throw firstError.error;  // ← Throws if ANY operation fails
```

The notification insert fails (due to BUG #3 - typo), which causes the whole operation to be marked as failed even though the 3 main operations succeeded.

#### What's Happening
```
results array contains:
[0] { data: {...}, error: null }           // ✅ profiles update - SUCCESS
[1] { data: {...}, error: null }           // ✅ freelancer_profiles update - SUCCESS
[2] { data: {...}, error: null }           // ✅ identity_verifications DELETE - SUCCESS
[3] { error: "column 'is_is_is_read' not found" }  // ❌ notification insert - FAILS (typo)

Code finds firstError = results[3]
Throws error → onError handler fires → Shows error toast
But verification WAS deleted! (results[2] succeeded)
```

#### The Fix

**Location**: `src/pages/admin/UsersTab.tsx` **Lines**: 191-192

Replace:
```typescript
const firstError = results.find(r => r.error);
if (firstError?.error) throw firstError.error;
```

With:
```typescript
// Only check critical operations (first 3)
const profileError = results[0]?.error;      // profiles update
const freelancerError = results[1]?.error;   // freelancer_profiles update  
const verificationError = results[2]?.error; // identity_verifications delete

// Throw if critical operations failed
if (profileError || freelancerError || verificationError) {
    throw profileError || freelancerError || verificationError;
}

// Non-critical: notification failure doesn't fail the operation
const notificationError = results[3]?.error;
if (notificationError) {
    console.warn('Notification failed but verification revoked:', notificationError);
}
```

#### Expected After Fix
- ✅ Verification deleted from database
- ✅ Success toast shows: "Verification revoked successfully"
- ✅ Error toast does NOT appear
- ✅ Admin dashboard updates immediately

---

### BUG #3: No Notification Sent to Revoked User

#### Symptoms
- Admin revokes a user's verification
- User's profile shows verification removed ✅
- But user never gets notification about it ❌
- User has no idea why their verification disappeared
- User can't see message explaining what happened

#### Root Cause #1: Typo in Column Name
**File**: `src/pages/admin/UsersTab.tsx` **Line**: 188

```typescript
// Current broken code:
supabase
    .from('notifications')
    .insert({
        user_id: user.id,
        type: 'system',
        title: tr('تم إلغاء توثيق حسابك', ...),
        content: tr('لقد قامت الإدارة بإلغاء...', ...),
        is_is_is_read: false,  // ← 🐛 TYPO: Should be "is_read"
    }),
```

**The Bug**: Column name has triple `is_` instead of single  
- Code sends: `is_is_is_read` (wrong - doesn't exist)
- Database expects: `is_read` (correct)
- Result: INSERT fails, notification never created

#### Root Cause #2: Wrong Notification Type
**File**: `src/pages/admin/UsersTab.tsx` **Line**: 185

```typescript
// Current broken code:
type: 'system',  // ← Should be 'identity_rejected'
```

Notification type should be `identity_rejected` not `system` for proper categorization.

#### The Fix

**Fix #1**: Correct the typo

**Location**: `src/pages/admin/UsersTab.tsx` **Line**: 188

Change:
```typescript
is_is_is_read: false,
```

To:
```typescript
is_read: false,
```

**Fix #2**: Correct the notification type

**Location**: `src/pages/admin/UsersTab.tsx` **Line**: 185

Change:
```typescript
type: 'system',
```

To:
```typescript
type: 'identity_rejected',
```

#### Expected After Fix
- ✅ Notification inserts successfully
- ✅ Revoked user receives notification: "Your account verification was revoked"
- ✅ Notification appears in unread state
- ✅ User knows what happened and can resubmit verification

---

## Summary Table: BUG #2 & #3 Fixes

| Bug | File | Line | Current | Fixed | Reason |
|-----|------|------|---------|-------|--------|
| #3 | `src/pages/admin/UsersTab.tsx` | 185 | `type: 'system'` | `type: 'identity_rejected'` | Correct notification category |
| #3 | `src/pages/admin/UsersTab.tsx` | 188 | `is_is_is_read: false` | `is_read: false` | Fix typo in column name |
| #2 | `src/pages/admin/UsersTab.tsx` | 191-192 | Check all results | Check only critical results | Only fail if main operations fail |

---

## Testing BUG #2 & #3 After Fix

### Test Case 1: Admin Revokes Verification
1. Login as admin
2. Navigate to Users tab
3. Find a verified user
4. Click "Revoke Verification" button
5. **Verify**: Success toast appears (not error toast)
6. **Verify**: Admin dashboard shows user as "Unverified"

### Test Case 2: Revoked User Gets Notification
1. Login as the revoked user (in incognito/separate browser)
2. Check Notifications tab
3. **Verify**: New notification appears
4. **Verify**: Title says "Your account verification was revoked" (or localized equivalent)
5. **Verify**: Notification is unread (badge shows)
6. **Verify**: User can read full message explaining they can resubmit

### Test Case 3: Database Verification
```sql
-- Check notification was created correctly
SELECT id, user_id, type, title, is_read, created_at 
FROM notifications 
WHERE type = 'identity_rejected' 
ORDER BY created_at DESC 
LIMIT 1;

-- Should show:
-- - type: 'identity_rejected' (not 'system')
-- - is_read: false
-- - user_id: the revoked user's ID
```

---

---

# BUG #4: Dashboard Shows Stale Data on First Load

## Overview

**File**: Multiple files  
**Total Changes Needed**: 3 critical locations + 1 optional  
**Root Cause**: Missing React Query cache invalidation after profile updates

---

## Symptoms

1. **First visit to dashboard**: Shows empty/minimal/placeholder data
   - Generic avatar "U"
   - 0 active jobs
   - 0 spending
   - Looks like app is broken

2. **Navigate away to Settings, then back**: Now shows real data
   - Real avatar image
   - Correct job count
   - Correct spending amounts

3. **Edit profile, return to dashboard**: Changes take ~60 seconds to appear

4. **Switch browser tabs**: Data doesn't refresh automatically

---

## Root Cause Analysis

### The Problem: Split Cache Management

Application has **TWO separate data sources** that can get out of sync:

```
1. AuthContext (React State)
   ├─ Stores: Current user profile
   ├─ Updated by: AuthContext.updateProfile()
   └─ Problem: Updates state but forgets to tell React Query

2. React Query (Cache Layer)
   ├─ Stores: Dashboard queries (stats, jobs, contracts)
   ├─ Caches for: 60 seconds (staleTime: 60_000)
   └─ Problem: Doesn't know profile changed, keeps serving old cache
```

### Timeline of the Bug

```
T=0s: User loads dashboard
     • React Query fetches 3 queries
     • All marked "fresh" for 60 seconds
     • Cache dependency: ['clientDashboardStats', profile?.id]

T=5s: User edits profile in Settings
     • Calls AuthContext.updateProfile()
     • Profile state CHANGES in context
     • ❌ React Query cache NOT invalidated
     • Cache still thinks it's fresh

T=10s: User navigates back to Dashboard
     • React Query checks: "Is cache fresh?" → YES (marked fresh at T=0)
     • Serves OLD cached data
     • Shows stale/empty state for up to 50 more seconds

T=65s: Cache finally expires naturally
     • React Query refetches (staleTime expired)
     • NOW shows correct data
```

### Code Evidence

**File**: `src/contexts/AuthContext.tsx` **Lines**: 539-569

```typescript
const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', auth.user?.id)
            .select()
            .single();

        if (error) throw error;

        // ✅ Updates local state
        setProfile(nextProfile);
        
        // ❌ MISSING: Invalidate React Query caches!
        // Should add:
        // queryClient.invalidateQueries({
        //     queryKey: ['clientDashboardStats']
        // });

        return { success: true };
    } catch (error) {
        return { success: false, error };
    } finally {
        setLoading(false);
    }
}, [auth.user?.id]);
```

### Affected Dashboard Queries

**File**: `src/pages/ClientDashboard.tsx` **Lines**: 156-220

```typescript
// All 3 queries use profile?.id in their cache key
// And all have staleTime: 60_000 (60 seconds)

const { data: stats } = useQuery({
    queryKey: ['clientDashboardStats', profile?.id],
    queryFn: () => getClientStats(profile!.id),
    staleTime: 60_000,  // ← Problem: Cache considered fresh for 60 seconds
    enabled: !!profile?.id,
});

const { data: jobs } = useQuery({
    queryKey: ['clientDashboardJobs', profile?.id],
    queryFn: () => getClientDashboardJobs(profile!.id),
    staleTime: 60_000,  // ← Same problem
    enabled: !!profile?.id,
});

const { data: contracts } = useQuery({
    queryKey: ['clientActiveContracts', profile?.id],
    queryFn: () => getClientActiveContracts(profile!.id),
    staleTime: 60_000,  // ← Same problem
    enabled: !!profile?.id,
});
```

---

## The Fixes Required

### Fix #1: Invalidate Cache in AuthContext (CRITICAL)

**File**: `src/contexts/AuthContext.tsx`

**Location**: Around line 569 (end of updateProfile method)

After the line `setProfile(nextProfile);`, add:

```typescript
// After profile is updated and setProfile is called:
queryClient.invalidateQueries({
    queryKey: ['clientDashboardStats']
});
queryClient.invalidateQueries({
    queryKey: ['clientDashboardJobs']
});
queryClient.invalidateQueries({
    queryKey: ['clientActiveContracts']
});
```

Also check for a `refreshProfile()` method around lines 630-635 and add the same invalidations there.

### Fix #2: Invalidate Cache in ProfileSettings (IMPORTANT)

**File**: `src/components/settings/ProfileSettings.tsx`

**Location**: In the `handleSave()` method, after profile update succeeds

Add:

```typescript
const handleSave = async () => {
    try {
        const result = await updateProfile(formData);
        
        if (result.success) {
            // Add this: Force refresh all client dashboard queries
            queryClient.invalidateQueries({
                queryKey: ['client']  // Matches all client* queries
            });
            
            showToast('Profile updated successfully', 'success');
        }
    } catch (error) {
        showToast('Update failed', 'error');
    }
};
```

### Fix #3: Enable Auto-Refresh on Tab Switch (NICE TO HAVE)

**File**: `src/lib/queryClient.ts`

**Location**: Around line 20

Change:
```typescript
refetchOnWindowFocus: false,  // Current
```

To:
```typescript
refetchOnWindowFocus: true,  // New - refreshes when user switches browser tabs
```

This makes the app refresh data automatically when user clicks back to the Khedma tab from another tab.

### Fix #4 (Optional): Reduce Cache Duration

**File**: `src/pages/ClientDashboard.tsx` **Lines**: 156-220

For faster detection of stale data, optionally reduce from 60 seconds to 30 seconds:

```typescript
// Change from:
staleTime: 60_000,

// To:
staleTime: 30_000,  // 30 seconds instead of 60
```

---

## Summary Table: BUG #4 Fixes

| File | Location | Current | Fix | Impact |
|------|----------|---------|-----|--------|
| `src/contexts/AuthContext.tsx` | Line ~569 | Missing invalidation | Add queryClient.invalidateQueries() | Immediate cache refresh on profile update |
| `src/contexts/AuthContext.tsx` | Line ~635 | refreshProfile() missing invalidation | Add queryClient.invalidateQueries() | Profile refresh also refreshes cache |
| `src/components/settings/ProfileSettings.tsx` | handleSave() | Missing invalidation | Add queryClient.invalidateQueries() | Settings save refreshes dashboard |
| `src/lib/queryClient.ts` | Line ~20 | refetchOnWindowFocus: false | Set to true | Tab switch auto-refreshes data |

---

## Testing BUG #4 After Fix

### Test Case 1: Fresh Dashboard Load
1. Logout completely
2. Clear browser cache (Ctrl+Shift+Delete)
3. Login fresh
4. Navigate directly to `/client/dashboard`
5. **Verify**: Shows real user data, not placeholder/empty state
6. **Verify**: Avatar shows user's actual image (not generic "U")
7. **Verify**: Correct job count, spending, and stats

### Test Case 2: Profile Changes Appear Immediately
1. From Dashboard, go to Settings
2. Change profile info (e.g., location, title, avatar)
3. Save changes
4. Navigate back to Dashboard tab
5. **Verify**: Changes appear IMMEDIATELY (no 60-second wait)
6. **Verify**: Avatar updates instantly
7. **Verify**: All affected stats update instantly

### Test Case 3: Tab Switch Refresh
1. Open Dashboard in Khedma tab
2. Open another app/tab (Gmail, YouTube, etc.)
3. Spend 5-10 seconds in other tab
4. Click back to Khedma tab
5. **Verify**: Dashboard data refreshes automatically
6. **Verify**: If you made changes in another window, they appear here

### Test Case 4: Multiple Edits
1. Edit profile info
2. Save
3. Immediately check dashboard
4. Edit again
5. Save
6. Check dashboard
7. **Verify**: Each change is reflected immediately without caching delays

---

## Implementation Checklist

### For Implementation Agent

- [ ] **Step 1**: Read `src/contexts/AuthContext.tsx` around lines 539-569
- [ ] **Step 2**: Add cache invalidation to `updateProfile()` method
- [ ] **Step 3**: Add cache invalidation to `refreshProfile()` method (if exists)
- [ ] **Step 4**: Read `src/components/settings/ProfileSettings.tsx`
- [ ] **Step 5**: Add cache invalidation to `handleSave()` method
- [ ] **Step 6**: Read `src/lib/queryClient.ts` around line 20
- [ ] **Step 7**: Change `refetchOnWindowFocus` to `true` (optional but recommended)
- [ ] **Step 8**: Run `npm run build` to verify no errors
- [ ] **Step 9**: Run tests: `npm run test`
- [ ] **Step 10**: Commit all changes with message: `fix: BUG #2, #3, #4 - revoke verification UX and dashboard cache invalidation`

---

---

# Summary of All Changes

## All Bugs at a Glance

| Bug | File | Lines | Change | Severity |
|-----|------|-------|--------|----------|
| #3 | `src/pages/admin/UsersTab.tsx` | 185 | `type: 'system'` → `type: 'identity_rejected'` | MEDIUM |
| #3 | `src/pages/admin/UsersTab.tsx` | 188 | `is_is_is_read: false` → `is_read: false` | MEDIUM |
| #2 | `src/pages/admin/UsersTab.tsx` | 191-192 | Refine error handling (see above) | MEDIUM |
| #4 | `src/contexts/AuthContext.tsx` | ~569 | Add queryClient.invalidateQueries() | MEDIUM |
| #4 | `src/contexts/AuthContext.tsx` | ~635 | Add queryClient.invalidateQueries() | MEDIUM |
| #4 | `src/components/settings/ProfileSettings.tsx` | handleSave() | Add queryClient.invalidateQueries() | MEDIUM |
| #4 | `src/lib/queryClient.ts` | ~20 | refetchOnWindowFocus: true | LOW |

---

## Total Changes Summary

- **Total Files to Modify**: 4
- **Total Lines to Change**: ~10 locations
- **Total Complexity**: LOW (straightforward fixes, no logic changes)
- **Expected Time to Implement**: 15-30 minutes
- **Testing Time**: 10-15 minutes

---

## Verification After All Fixes

After implementation, verify:

✅ Admin can revoke verification without error toast  
✅ Revoked user receives notification immediately  
✅ Dashboard shows real data on first load (no stale data)  
✅ Profile changes appear on dashboard immediately  
✅ Tab switching refreshes data automatically  
✅ No compilation errors: `npm run build`  
✅ All tests pass: `npm run test`

---

## Git Commit Information

**Commit message to use**:
```
fix: BUG #2, #3, #4 - revoke verification UX and dashboard cache invalidation

- BUG #2: Refine error handling to not fail on non-critical notification insert
- BUG #3: Fix typo (is_is_is_read → is_read) and notification type (system → identity_rejected)
- BUG #4: Add queryClient.invalidateQueries() calls to refresh dashboard cache on profile updates
- Enable refetchOnWindowFocus for auto-refresh on tab switch
```

---

## Files Ready for Reference

- ✅ `BUG_ISSUE_SPECS_BUG2_BUG3.md` - Detailed BUG #2 & #3 analysis
- ✅ `BUG_ISSUE_SPECS_BUG4.md` - Detailed BUG #4 analysis
- ✅ `BUG_FIXES_COMPREHENSIVE_REPORT.md` (THIS FILE) - All bugs consolidated
