# 🚀 Workspace Migration Instructions

## What You Need to Do Now

You have **3 options** to apply the workspace-scoped architecture migrations:

---

## ✅ Option 1: Use the Interactive HTML Tool (Easiest)

1. **Open the migration tool**
   - Open `apply-migrations.html` in your browser
   - Or visit: `file:///C:/Users/pc/Desktop/khedma-tn/apply-migrations.html`

2. **Get your Service Role Key**
   - Go to: https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd/settings/api
   - Copy the `service_role` key (secret)

3. **Apply migrations**
   - Paste your service role key in the tool
   - Click "Apply Migration 1" button
   - Wait for success, then click "Apply Migration 2"
   - Wait for success, then click "Apply Migration 3"
   - Done! 🎉

---

## ✅ Option 2: Use Supabase Dashboard SQL Editor (Recommended)

1. **Go to SQL Editor**
   - Visit: https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd/sql/new

2. **Apply Migration 1**
   - Open file: `supabase/migrations/20260410103000_expand_onboarding_profile_fields.sql`
   - Copy all content
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success ✓

3. **Apply Migration 2**
   - Open file: `supabase/migrations/20260410114000_fix_set_user_account_status_notification_overload.sql`
   - Copy all content
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success ✓

4. **Apply Migration 3**
   - Open file: `supabase/migrations/20260410132000_workspace_scoped_conversations_and_mode_avatars.sql`
   - Copy all content
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success ✓

---

## ✅ Option 3: Install Supabase CLI (For Future)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref wvgkezmboewtlpnyjnyd

# Apply all migrations
supabase db push
```

---

## 🧪 After Applying Migrations - Test Everything

### 1. Test Mode Switching
- Login to your app: https://khedmetna.tn
- Switch between Client and Freelancer modes
- Check that no errors appear in browser console (F12)

### 2. Test Avatar Upload
- Upload an avatar in Client mode
- Switch to Freelancer mode
- Upload a different avatar
- Switch back to Client mode
- Verify the Client avatar is still there (not overwritten)

### 3. Test Messaging
- Send a message in Client mode
- Switch to Freelancer mode
- Check that messages are properly filtered
- Contract messages should appear in both modes

### 4. Verify Database Changes

Run this in SQL Editor to confirm:

```sql
-- Check new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('avatar_url_client', 'avatar_url_freelancer');

-- Check conversation scope column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'conversations' 
  AND column_name = 'conversation_scope';

-- Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_or_create_conversation';
```

Expected: All queries should return results.

---

## 🐛 Troubleshooting

### Error: "column does not exist"
**Solution:** Migration didn't apply. Re-run the migration in SQL Editor.

### Error: "function does not exist"
**Solution:** Migration 3 didn't complete. Re-run it in SQL Editor.

### Error: "permission denied"
**Solution:** Check that you're using the service_role key, not the anon key.

### Messages not filtering by workspace
**Solution:** 
1. Check browser console for errors
2. Verify migration 3 applied successfully
3. Clear browser cache and reload

### Avatars overwriting each other
**Solution:**
1. Check that `avatar_url_client` and `avatar_url_freelancer` columns exist
2. Verify the onboarding code is using the correct column based on mode
3. Check `src/pages/FreelancerOnboarding.tsx` and `src/pages/ClientOnboarding.tsx`

---

## 📊 What These Migrations Do

### Migration 1: Expand Onboarding Profile Fields
- Adds company fields for clients (company_name, company_website, etc.)
- Adds experience fields for freelancers (years_experience, tools, etc.)
- Enables richer profile data collection

### Migration 2: Fix Notification Overload
- Fixes admin notification function conflicts
- Ensures proper notifications for account status changes
- Resolves ambiguous function overload errors

### Migration 3: Workspace-Scoped Conversations and Mode Avatars
- **Adds `avatar_url_client` column** - stores client mode avatar
- **Adds `avatar_url_freelancer` column** - stores freelancer mode avatar
- **Adds `conversation_scope` column** - tracks which workspace owns the conversation
- **Updates `get_or_create_conversation` function** - creates workspace-specific conversations
- **Creates indexes** - for efficient workspace-filtered queries
- **Migrates existing data** - contract conversations get 'contract' scope

---

## 🎯 Success Criteria

You'll know everything worked when:

✅ No errors in browser console when switching modes
✅ Avatars stay separate between client and freelancer modes
✅ Messages filter correctly by workspace
✅ Contract messages appear in both modes
✅ All 3 migrations show "Success" status

---

## 📚 Additional Resources

- **Architecture Documentation:** `WORKSPACE_PROFILE_MESSAGING_MAP.md`
- **Detailed Migration Guide:** `APPLY_WORKSPACE_MIGRATIONS.md`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase logs: https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd/logs/explorer
3. Check browser console (F12) for JavaScript errors
4. Verify all 3 migrations applied successfully

---

## ✨ What's Next After Migrations?

Once migrations are applied and tested:

1. **Phase 2 Implementation** (optional):
   - Fully strict role-separated inbox views
   - Contract tab split by role
   - Role-specific public avatar rendering everywhere

2. **Production Deployment:**
   - Test thoroughly in development first
   - Apply migrations to production database
   - Monitor for any issues

3. **User Communication:**
   - Inform users about new workspace features
   - Update help documentation
   - Add tooltips explaining mode-specific avatars

---

**Ready to start?** Choose one of the 3 options above and apply the migrations! 🚀
