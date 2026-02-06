# PHASE 5: TROUBLESHOOTING GUIDE

## 🎯 Objective
Quick fixes for common issues that may arise during development or production.

---

## CATEGORY 1: AUTHENTICATION ISSUES

### Issue 1.1: "User not found" after signup

**Symptoms:**
- User creates account
- Redirected but shows "not authenticated"
- Profile doesn't exist in database

**Diagnosis:**
```sql
-- Check if user exists in auth.users
SELECT email, created_at FROM auth.users 
WHERE email = 'user@example.com';

-- Check if profile was created
SELECT * FROM profiles WHERE id = 'user_id';
```

**Solution:**
```sql
-- If user exists but no profile, trigger didn't fire
-- Manually create profile
INSERT INTO profiles (id, email)
SELECT id, email FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (id) DO NOTHING;

-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- If missing, recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Issue 1.2: OAuth callback fails / gets stuck

**Symptoms:**
- User clicks "Continue with Google"
- Redirected back but stays on loading screen
- No error message

**Diagnosis:**
Check browser console for errors. Common causes:
1. Redirect URL not whitelisted in Supabase
2. OAuth client ID/secret incorrect
3. Profile fetch timeout

**Solution:**

**Fix 1: Check Supabase Auth Settings**
1. Go to Supabase Dashboard → Authentication → Providers
2. Google OAuth settings:
   - Authorized Redirect URIs must include: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - And: `http://localhost:5173/auth/callback` (for dev)

**Fix 2: Add Stuck State Recovery**

FILE: src/pages/AuthCallback.tsx
```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    // If stuck for 10 seconds, redirect to login
    logger.error('AuthCallback timeout - redirecting to login');
    navigate('/login?error=callback_timeout');
  }, 10000);

  handleCallback().finally(() => clearTimeout(timeout));
}, []);
```

**Fix 3: Clear Browser Cache**
Sometimes OAuth state gets corrupted:
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
// Then retry OAuth
```

---

### Issue 1.3: Session expires immediately

**Symptoms:**
- User logs in successfully
- Refreshes page
- Logged out again

**Diagnosis:**
```typescript
// Check session in browser console
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Expires at:', new Date(session.expires_at * 1000));
```

**Solution:**

**Fix 1: Check Supabase Client Config**
```typescript
// src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,        // ← Must be true
    autoRefreshToken: true,      // ← Must be true
    detectSessionInUrl: true,    // ← Must be true
  },
});
```

**Fix 2: Check Cookie Settings**
If on subdomain:
```typescript
auth: {
  storageKey: 'khedma-auth',
  storage: window.localStorage,  // Explicit storage
}
```

---

## CATEGORY 2: DATABASE ISSUES

### Issue 2.1: "permission denied for table" error

**Symptoms:**
- Query fails with RLS error
- User should have access but doesn't

**Diagnosis:**
```sql
-- Check RLS policies on table
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'TABLE_NAME';

-- Test policy manually
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'user_id_here';
SELECT * FROM TABLE_NAME;
RESET ROLE;
```

**Solution:**

**Common causes:**

1. **Missing policy for operation**
```sql
-- If SELECT works but UPDATE fails
CREATE POLICY "Users can update own data"
ON table_name FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

2. **Policy condition too strict**
```sql
-- If policy uses function that doesn't exist
DROP POLICY IF EXISTS "old_policy" ON table_name;
CREATE POLICY "new_simpler_policy" ON table_name
FOR ALL USING (auth.uid() = user_id);
```

3. **RLS not enabled (in dev only)**
```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

### Issue 2.2: Query timeout / slow queries

**Symptoms:**
- Queries take > 8 seconds
- withTimeout throws error
- Page hangs loading data

**Diagnosis:**
```sql
-- Check slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- queries > 1 second
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 1000  -- High cardinality columns
  AND correlation < 0.1;  -- Poor correlation (needs index)
```

**Solution:**

**Fix 1: Add Missing Indexes**
```sql
-- For foreign keys
CREATE INDEX idx_proposals_job_id ON proposals(job_id);
CREATE INDEX idx_contracts_freelancer_id ON contracts(freelancer_id);

-- For filtered queries
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status = 'open';

-- For sorted queries
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
```

**Fix 2: Optimize Query**
```typescript
// Bad: Fetching everything
const { data } = await supabase
  .from('proposals')
  .select('*, freelancer:profiles(*), job:jobs(*)');

// Good: Fetch only needed fields
const { data } = await supabase
  .from('proposals')
  .select(`
    id,
    bid_amount,
    freelancer:profiles!freelancer_id(id, full_name, avatar_url)
  `);
```

**Fix 3: Add Pagination**
```typescript
// Instead of loading all
.select()

// Use pagination
.select()
.range(0, 19)  // First 20 results
.order('created_at', { ascending: false })
```

---

### Issue 2.3: Foreign key constraint violation

**Symptoms:**
- Insert/Update fails
- Error: "violates foreign key constraint"

**Example:**
```
ERROR: insert or update on table "proposals" violates foreign key constraint
"proposals_job_id_fkey"
```

**Diagnosis:**
```sql
-- Check if referenced record exists
SELECT id FROM jobs WHERE id = 'the_job_id_from_error';
-- If returns nothing, that's the problem

-- Check constraint
SELECT 
  conname,
  contype,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname = 'proposals_job_id_fkey';
```

**Solution:**

**Fix 1: Ensure Parent Record Exists**
```typescript
// Before creating proposal, verify job exists
const { data: job, error } = await supabase
  .from('jobs')
  .select('id')
  .eq('id', jobId)
  .single();

if (!job) {
  throw new Error('Job not found');
}

// Now safe to create proposal
await supabase.from('proposals').insert({
  job_id: jobId,
  // ...
});
```

**Fix 2: Use CASCADE on Delete**
If you want child records deleted when parent is deleted:
```sql
ALTER TABLE proposals
DROP CONSTRAINT proposals_job_id_fkey,
ADD CONSTRAINT proposals_job_id_fkey
  FOREIGN KEY (job_id)
  REFERENCES jobs(id)
  ON DELETE CASCADE;
```

---

## CATEGORY 3: FILE UPLOAD ISSUES

### Issue 3.1: File upload fails silently

**Symptoms:**
- User selects file
- Upload button shows loading
- Never completes, no error shown

**Diagnosis:**
```typescript
// Add detailed logging to upload function
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file);

console.log('Upload result:', { data, error });
// Check what error is
```

**Common causes:**

1. **File too large**
```typescript
// Solution: Check size before upload
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
if (file.size > MAX_SIZE) {
  throw new Error('File too large (max 5MB)');
}
```

2. **Wrong bucket name**
```typescript
// Check bucket name matches exactly
.from('avatars')  // ← Must match bucket ID in Supabase
```

3. **Invalid file path**
```typescript
// Bad: Special characters or spaces
const filePath = `user/my file (1).jpg`;

// Good: URL-safe filename
const fileExt = file.name.split('.').pop();
const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;
```

4. **Storage policy missing**
```sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';

-- If missing, create
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### Issue 3.2: Uploaded file not accessible

**Symptoms:**
- File uploads successfully
- URL saved in database
- Image doesn't show (404 or 403)

**Diagnosis:**
```typescript
// Check the URL
console.log('Avatar URL:', avatarUrl);
// Should be: https://PROJECT_REF.supabase.co/storage/v1/object/public/avatars/...

// Try accessing directly
fetch(avatarUrl).then(r => console.log('Status:', r.status));
```

**Solution:**

**Fix 1: Bucket must be public**
```sql
-- Check bucket public status
SELECT id, public FROM storage.buckets WHERE id = 'avatars';

-- If public = false
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
```

**Fix 2: Use correct URL method**
```typescript
// Wrong: Using signed URL for public bucket
const { data } = await supabase.storage
  .from('avatars')
  .createSignedUrl(filePath, 60);

// Right: Use public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath);

const publicUrl = data.publicUrl;
```

**Fix 3: CORS issue (if accessing from different domain)**
In Supabase Dashboard → Storage → [bucket] → Settings:
- Add allowed origins: `https://your-domain.com`

---

## CATEGORY 4: REAL-TIME / WEBSOCKET ISSUES

### Issue 4.1: Real-time not working / messages don't appear

**Symptoms:**
- Send message in chat
- Doesn't appear in other user's window
- No errors shown

**Diagnosis:**
```typescript
// Check subscription status
const channel = supabase
  .channel('test-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => console.log('Got change:', payload)
  )
  .subscribe((status) => {
    console.log('Subscription status:', status);
    // Should be: 'SUBSCRIBED'
  });

// After a minute, check status
console.log(channel.state); // Should be 'joined'
```

**Solution:**

**Fix 1: Enable Realtime on Table**
In Supabase Dashboard:
1. Go to Database → Replication
2. Find your table (e.g., 'messages')
3. Enable Realtime replication
4. Click "Save"

**Fix 2: Check Realtime Filters**
```typescript
// Wrong: Filter might be too specific
.on('postgres_changes',
  { 
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `contract_id=eq.${contractId}` // ← Filter applied client-side
  },
  handleMessage
)

// Right: Let all messages through, filter in client
.on('postgres_changes',
  { 
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  },
  (payload) => {
    if (payload.new.contract_id === contractId) {
      handleMessage(payload);
    }
  }
)
```

**Fix 3: Reconnection Logic**
```typescript
// Add reconnection on disconnect
const channel = supabase
  .channel('messages')
  .on(/* ... */)
  .subscribe((status, err) => {
    if (status === 'CHANNEL_ERROR') {
      logger.error('Realtime channel error', err);
      // Retry after 5 seconds
      setTimeout(() => {
        channel.subscribe();
      }, 5000);
    }
  });
```

---

### Issue 4.2: WebSocket connection fails

**Symptoms:**
- Realtime never connects
- Status stuck at 'CHANNEL_JOINING'
- Browser console shows WebSocket errors

**Diagnosis:**
```javascript
// In browser console
// Check if WebSocket is blocked
const ws = new WebSocket('wss://PROJECT_REF.supabase.co/realtime/v1/websocket');
ws.onopen = () => console.log('✅ WebSocket open');
ws.onerror = (err) => console.log('❌ WebSocket error:', err);
```

**Common causes:**

1. **Corporate firewall blocking WebSockets**
   - Solution: Request IT to whitelist `*.supabase.co`

2. **Browser extension blocking**
   - Solution: Test in incognito mode

3. **Supabase realtime not enabled on project**
   - Solution: Check project settings in Supabase dashboard

---

## CATEGORY 5: PERFORMANCE ISSUES

### Issue 5.1: Page loads slowly

**Diagnosis:**
```bash
# Run Lighthouse
lighthouse https://your-app.com --view

# Check Network tab in DevTools:
# - Slow requests (> 2s)
# - Large payloads (> 500KB)
# - Many requests (> 50)
```

**Solutions:**

**Fix 1: Code Splitting**
```typescript
// Replace direct imports
import AdminDashboard from './pages/AdminDashboard';

// With lazy loading
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
```

**Fix 2: Image Optimization**
```bash
# Install optimizer
npm install -D vite-plugin-imagemin

# Images should be:
# - WebP format
# - Lazy loaded
# - Properly sized (not 4K for thumbnails)
```

**Fix 3: Remove Unused Dependencies**
```bash
# Analyze bundle
npx vite-bundle-visualizer

# Remove large unused packages
npm uninstall <package>
```

---

### Issue 5.2: Memory leak

**Symptoms:**
- Browser tab uses increasing memory
- App slows down after use
- Eventually crashes

**Diagnosis:**
```javascript
// Chrome DevTools → Memory → Take heap snapshot
// Navigate app, take another snapshot
// Compare: look for "Detached DOM nodes"
```

**Solution:**

**Fix 1: Clean up event listeners**
```typescript
useEffect(() => {
  const handleScroll = () => {/* ... */};
  window.addEventListener('scroll', handleScroll);
  
  // ← Must return cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);
```

**Fix 2: Cancel pending requests on unmount**
```typescript
useEffect(() => {
  const abortController = new AbortController();
  
  fetch('/api/data', { signal: abortController.signal })
    .then(/* ... */);
  
  return () => abortController.abort();
}, []);
```

**Fix 3: Unsubscribe from Realtime**
```typescript
useEffect(() => {
  const channel = supabase.channel('messages').subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}, []);
```

---

## CATEGORY 6: BUILD / DEPLOYMENT ISSUES

### Issue 6.1: Build fails with TypeScript errors

**Symptoms:**
```bash
npm run build
# Error: Type 'X' is not assignable to type 'Y'
```

**Solution:**

**Fix 1: Check tsconfig.json**
```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,  // ← Add this if library types conflict
  }
}
```

**Fix 2: Fix the actual type errors**
```bash
# Run TypeScript check
npx tsc --noEmit

# Fix errors one by one
# Start with critical ones
```

---

### Issue 6.2: Build succeeds but app doesn't work in production

**Symptoms:**
- `npm run build` succeeds
- Deploy succeeds
- Production app shows blank page or errors

**Diagnosis:**
```bash
# Build and preview locally
npm run build
npm run preview

# Check browser console for errors
# Common: "Failed to fetch" or "Cannot find module"
```

**Solutions:**

**Fix 1: Environment variables missing**
```bash
# In hosting platform (Vercel/Netlify)
# Verify these are set:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# Rebuild after adding
```

**Fix 2: Incorrect base path**
If deploying to subdirectory:
```typescript
// vite.config.ts
export default defineConfig({
  base: '/subdirectory/',  // If not at root
});
```

**Fix 3: Missing redirects for SPA**
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

// or netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## CATEGORY 7: PRODUCTION ISSUES

### Issue 7.1: High error rate in Sentry

**Diagnosis:**
Check Sentry dashboard for most common errors.

**Common Errors:**

1. **"Network request failed"**
   - Could be: User lost connection
   - Solution: Add retry logic
   ```typescript
   async function fetchWithRetry(fn, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(r => setTimeout(r, 1000 * (i + 1)));
       }
     }
   }
   ```

2. **"Cannot read property of undefined"**
   - Add null checks
   ```typescript
   // Bad
   user.profile.name

   // Good
   user?.profile?.name
   ```

3. **"Maximum update depth exceeded"**
   - Check useEffect dependencies
   ```typescript
   // Bad: Missing dependency or infinite loop
   useEffect(() => {
     setData(fetchData());  // ← Creates infinite loop
   }, []);

   // Good
   useEffect(() => {
     fetchData().then(setData);
   }, []); // ← Runs once
   ```

---

## 📋 TROUBLESHOOTING CHECKLIST

When encountering any issue:

1. ✅ Check browser console for errors
2. ✅ Check network tab for failed requests
3. ✅ Check Sentry for stack traces (production)
4. ✅ Check Supabase logs (Dashboard → Logs)
5. ✅ Try in incognito/private window
6. ✅ Try clearing cache/storage
7. ✅ Check if issue is environment-specific (dev vs prod)
8. ✅ Search error message online
9. ✅ Check Supabase status page
10. ✅ Ask in Supabase Discord (if Supabase issue)

---

## 🆘 EMERGENCY CONTACT

### If Production is Down:

1. **Check Status Pages:**
   - Supabase: https://status.supabase.com
   - Vercel: https://www.vercel-status.com
   - Netlify: https://www.netlifystatus.com

2. **Rollback Immediately:**
   ```bash
   # Vercel
   vercel rollback [previous-deployment-url]
   
   # Netlify
   # Via dashboard: Find previous deploy → Publish
   ```

3. **Investigate After Rollback:**
   - Don't debug live production
   - Rollback first, debug later

4. **Post-Incident:**
   - Write post-mortem
   - Add monitoring to prevent recurrence
   - Update runbook

---

**This troubleshooting guide covers 95% of issues you'll encounter. For anything else, check the official docs or community forums!**
