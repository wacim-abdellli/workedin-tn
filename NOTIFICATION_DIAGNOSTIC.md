# NOTIFICATION SYSTEM - DIAGNOSTIC GUIDE

## Status: Debugging in Progress 🔍

You're not receiving notifications when:
- Submitting ID verification ✗
- Admin approves verification ✗  
- Admin rejects verification ✗

But the UI shows the verification was processed (status = approved).

---

## Step 1: Enable Browser Console Logging

**Do this NOW:**

1. Open your browser (Chrome/Firefox/Safari)
2. Press `F12` to open Developer Tools
3. Click the **"Console"** tab
4. Keep the console visible while testing

---

## Step 2: Reproduce the Issue & Check Logs

### Scenario A: Admin Approves Verification

1. Go to Admin Dashboard (localhost:5173/admin)
2. Click "Verification" tab
3. Find a pending verification
4. Click "Approve" button
5. **LOOK AT CONSOLE** (bottom of screen)

**What to look for:**
- ✅ If you see: `Verification approved ✓` toast → Good so far
- 🔴 If you see: `[Notification] Failed to insert approval notification: ...` → Found the problem!
- 🔴 If you see: ANY error message starting with `[Notification]` → Copy it and send to me

### Scenario B: User Submits Verification

1. Go to localhost:5173/freelancer/verify-identity
2. Upload ID front, back, selfie
3. Click "Confirm and submit"
4. **LOOK AT CONSOLE**

**What to look for:**
- 🔴 Error messages starting with `[Notification]`
- ✅ If no errors and notification shows in navbar → System works!

---

## Step 3: Copy Any Errors You See

**If you see `[Notification]` errors in console:**

1. Right-click on the error
2. Select "Copy"
3. Paste here so I can see what's happening

**Example error format:**
```
[Notification] Failed to insert approval notification: Error: Permission denied...
```

---

## Step 4: Check Network Tab

If you don't see `[Notification]` errors but still no notifications:

1. Open Developer Tools (F12)
2. Click "Network" tab
3. Reproduce the issue (approve verification)
4. Look for a request to `/rest/v1/notifications`
5. Check the response:
   - ✅ If status `201`: Insert succeeded (but notification not showing?)
   - 🔴 If status `401/403`: Permission denied (RLS issue)
   - 🔴 If status `4xx/5xx`: Server error

---

## Step 5: Check Database Directly

**Query the notifications table to see if records exist:**

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor**
4. Run this query:

```sql
SELECT 
    id,
    user_id,
    type,
    title,
    created_at,
    is_read
FROM notifications
ORDER BY created_at DESC
LIMIT 20;
```

**Results:**
- ✅ If you see notification rows: INSERT worked but UI not updating
- 🔴 If empty: Notifications not being inserted at all

---

## Possible Issues & Solutions

### Issue 1: RLS Policy Still Blocking Inserts
**Error:** `Error: new row violates row-level security policy`

**Solution Already Applied:**
- Migration `20260403000000_fix_notifications_insert_policy.sql` changed RLS policy
- Should allow `auth.uid() = user_id` INSERTs

**If still seeing this error:** RLS policy change didn't apply properly
- Verify migration was applied: `npx supabase migration list`
- Re-apply if needed: `npx supabase db push`

---

### Issue 2: App Code Not Calling Notification INSERT
**Symptom:** No `[Notification]` errors in console, but no notifications in UI

**Check:**
- VerificationsTab.tsx:218 - Is approval notification insert happening?
- VerificationsTab.tsx:236 - Is rejection notification insert happening?
- VerifyIdentity.tsx:255 - Is submission notification insert happening?

The code IS there and logging errors now.

---

### Issue 3: Realtime Subscription Not Working
**Symptom:** Notification inserted in DB (you can see in SQL query) but not appearing in UI

**Check:**
- useRealtimeNotifications.ts:53-76 - WebSocket subscription
- NotificationBell.tsx - Component receiving data

**Test:**
```javascript
// In browser console:
localStorage.getItem('supabase.auth.token')
// Should show a valid token
```

---

## Complete Checklist

- [ ] Build fresh: `npm run build` ✅
- [ ] Open browser console (F12)
- [ ] Test admin approve (watch for `[Notification]` errors)
- [ ] Copy any error messages
- [ ] Check database query results
- [ ] Send me the findings

---

## Files Modified for Debugging

1. **src/pages/VerifyIdentity.tsx:261**
   - Added error logging for submission notification

2. **src/pages/admin/VerificationsTab.tsx:225, 243**
   - Added error logging for approval/rejection notifications

These changes log to browser console with `[Notification]` prefix so we can identify failures.

---

## Next Steps After Diagnosis

Once you've:
1. ✅ Checked browser console for errors
2. ✅ Taken a screenshot of any `[Notification]` errors
3. ✅ Run the SQL query to check database

Send me:
- Any console error messages
- Screenshot of the error
- Query results from notifications table

Then I can pinpoint exactly what's failing and fix it!

---

**For now: Test and check your console!** 🔍

