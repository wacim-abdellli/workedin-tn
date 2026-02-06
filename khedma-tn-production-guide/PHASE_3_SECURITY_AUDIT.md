# PHASE 3: SECURITY AUDIT & HARDENING

## 🎯 Objective
Identify and fix security vulnerabilities before production deployment.

---

## PART 1: AUTHENTICATION SECURITY

### Test 1: Authentication Flow Security

#### Check 1: Password Security
```sql
-- Verify Supabase Auth password policies
-- Go to Supabase Dashboard → Authentication → Policies

Required settings:
✅ Minimum password length: 8 characters
✅ Require special characters: Yes
✅ Require numbers: Yes
✅ Password reset enabled: Yes
✅ Email confirmation required: Yes (production)
```

#### Check 2: Session Management
```typescript
// Verify session settings in src/lib/supabase.ts

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,        // ✅ Auto-refresh before expiry
    persistSession: true,           // ✅ Persist across page loads
    detectSessionInUrl: true,       // ✅ Handle OAuth callbacks
    flowType: 'pkce',              // ✅ More secure OAuth flow
  },
});
```

#### Check 3: Logout Security
Test scenario:
1. Login to account
2. Open DevTools → Application → Storage
3. Note session cookies/tokens
4. Logout
5. ✅ VERIFY: All session data cleared
6. Try to access protected route
7. ✅ VERIFY: Redirects to login

#### Check 4: Concurrent Session Handling
1. Login on Browser A
2. Login on Browser B with same account
3. Logout on Browser A
4. ✅ VERIFY: Browser B still has valid session (or both logout if single-session policy desired)

---

## PART 2: ROW LEVEL SECURITY (RLS) AUDIT

### Critical RLS Tests

#### Test 1: Profile Data Access
```sql
-- Test as User A (id: user_a_id)
-- Try to access User B's profile

-- This should FAIL (return empty)
SELECT * FROM profiles WHERE id = 'user_b_id';

-- This should SUCCEED
SELECT * FROM profiles WHERE id = 'user_a_id';

-- Public profile data should be accessible
SELECT id, full_name, user_type FROM profiles WHERE id = 'user_b_id';
-- Should succeed for public fields only
```

**Fix if failing:**
```sql
-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for own profile access
CREATE POLICY "Users can access own profile"
ON profiles FOR ALL
USING (auth.uid() = id);

-- Policy for public profile viewing
CREATE POLICY "Public profiles viewable"
ON profiles FOR SELECT
USING (true); -- But with limited fields via SELECT statement
```

#### Test 2: Job Access Control
```sql
-- Scenario: User A tries to update User B's job

-- As User A, try to update User B's job (should FAIL)
UPDATE jobs 
SET title = 'Hacked!' 
WHERE client_id = 'user_b_id';
-- Expected: 0 rows updated

-- As User A, try to update own job (should SUCCEED)
UPDATE jobs 
SET title = 'Updated Title' 
WHERE client_id = 'user_a_id';
-- Expected: 1 row updated
```

**Verify policy:**
```sql
-- Check jobs RLS policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'jobs';

-- Should have:
-- 1. Public read for open jobs
-- 2. Client-only write
-- 3. Freelancers can view jobs they applied to
```

#### Test 3: Proposal Confidentiality
```sql
-- User A and User B both apply to same job
-- User A should NOT see User B's proposal details

-- As User A (freelancer)
SELECT * FROM proposals 
WHERE job_id = 'some_job_id' AND freelancer_id = 'user_b_id';
-- Should return: 0 rows (can't see other proposals)

-- As Client (job owner)
SELECT * FROM proposals WHERE job_id = 'some_job_id';
-- Should return: ALL proposals (client can see all)

-- As Freelancer A
SELECT * FROM proposals WHERE freelancer_id = 'user_a_id';
-- Should return: Only own proposals
```

**Fix if needed:**
```sql
DROP POLICY IF EXISTS "Proposal access control" ON proposals;

CREATE POLICY "Proposal access control"
ON proposals FOR SELECT
USING (
  auth.uid() = freelancer_id OR  -- Own proposals
  auth.uid() IN (                -- Or job owner
    SELECT client_id FROM jobs WHERE id = job_id
  )
);
```

#### Test 4: Message Privacy
```sql
-- User A and User B have separate contracts
-- User A should NOT see User B's messages

-- As User A
SELECT * FROM messages 
WHERE contract_id = 'user_b_contract_id';
-- Should return: 0 rows

-- Verify only contract parties can see messages
SELECT * FROM messages 
WHERE contract_id IN (
  SELECT id FROM contracts 
  WHERE client_id = 'user_a_id' OR freelancer_id = 'user_a_id'
);
-- Should return: Only User A's messages
```

#### Test 5: Financial Data Protection
```sql
-- Test wallet access

-- As User A, try to access User B's wallet (should FAIL)
SELECT balance FROM wallets WHERE user_id = 'user_b_id';
-- Should return: 0 rows or error

-- Access own wallet (should SUCCEED)
SELECT balance FROM wallets WHERE user_id = 'user_a_id';
-- Should return: User A's balance

-- Transactions
SELECT * FROM transactions WHERE user_id = 'user_b_id';
-- Should return: 0 rows (can't see other users' transactions)
```

---

## PART 3: INPUT VALIDATION & XSS PREVENTION

### Test 1: XSS in Text Inputs

**Test Payloads:**
```javascript
// Test these in various forms (job title, bio, messages, etc.)

const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<svg onload=alert("XSS")>',
  '"><script>alert("XSS")</script>',
];
```

**Test Each Form:**
1. Job posting form → Title, Description
2. Profile bio
3. Proposal cover letter
4. Chat messages
5. Review comments

**Expected Behavior:**
- ✅ Script tags should be stripped or escaped
- ✅ No JavaScript execution
- ✅ Special characters encoded

**Fix XSS (if needed):**

Already handled if using React properly (auto-escapes), but verify:

```typescript
// BAD: Never use dangerouslySetInnerHTML with user input
<div dangerouslySetInnerHTML={{ __html: userBio }} />

// GOOD: Let React escape
<div>{userBio}</div>

// If you MUST render HTML, sanitize first
import DOMPurify from 'dompurify';

<div 
  dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(userBio) 
  }} 
/>
```

### Test 2: SQL Injection

Supabase protects against SQL injection by default, but verify:

**Test in search/filter inputs:**
```javascript
// Try these search terms
const sqlInjectionPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE jobs; --",
  "' UNION SELECT * FROM profiles --",
];
```

**Expected:**
- ✅ Queries should fail safely or return no results
- ✅ No database errors exposed to user
- ✅ Tables remain intact

**Verify Safe Query Building:**
```typescript
// BAD: String concatenation (don't do this)
const query = `SELECT * FROM jobs WHERE title = '${searchTerm}'`;

// GOOD: Parameterized queries (Supabase does this automatically)
const { data } = await supabase
  .from('jobs')
  .select()
  .ilike('title', `%${searchTerm}%`); // Safe: properly escaped
```

### Test 3: File Upload Security

#### Test Malicious Files
1. Try to upload:
   - `.exe` file
   - `.php` file
   - `.html` file with scripts
   - Oversized file (> 5MB)
   - File with no extension

**Expected:**
- ✅ Only allowed file types accepted (images, PDFs, docs)
- ✅ Size limit enforced
- ✅ Files scanned/validated before storage

**Verify File Validation:**

FILE: src/hooks/useFileUpload.ts
```typescript
const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'application/msword'],
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFile(file: File, type: 'images' | 'documents') {
  // Check type
  if (!ALLOWED_TYPES[type].includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  // Check size
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large (max 5MB)' };
  }
  
  return { valid: true };
}
```

#### Test Storage Bucket Security
```sql
-- Verify storage policies in Supabase
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';

-- Should have:
-- 1. Public read (anyone can view avatars)
-- 2. Authenticated users can upload to own folder
-- 3. Users can only delete their own files
```

---

## PART 4: API SECURITY

### Test 1: Rate Limiting

**Test API Abuse:**
```javascript
// Try to make 100 rapid requests
for (let i = 0; i < 100; i++) {
  await supabase.from('jobs').select();
}
```

**Expected:**
- ✅ Supabase should rate-limit after ~100 requests/minute
- ✅ User gets 429 error
- ✅ App shows friendly error message

**Implement Client-Side Rate Limiting:**

FILE: src/lib/rateLimiter.ts
```typescript
class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number; // milliseconds

  constructor(limit: number = 10, window: number = 60000) {
    this.limit = limit;
    this.window = window;
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);
    
    if (this.requests.length >= this.limit) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.window - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}

export const apiLimiter = new RateLimiter(10, 60000); // 10 req/min
```

### Test 2: CORS Configuration

Check Supabase CORS settings:
- ✅ Only your domains allowed
- ✅ Localhost allowed in development
- ✅ Credentials included

### Test 3: Environment Variables Security

```bash
# Check for exposed secrets
git log --all -p | grep -i "supabase_key\|api_key\|secret"

# Should return: Nothing (no secrets in git history)
```

**Verify .gitignore:**
```
.env
.env.local
.env.production
.env.development
```

**Check production env vars:**
```bash
# In production hosting platform (Vercel/Netlify/etc.)
# Verify these are set:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
# (Never commit these!)
```

---

## PART 5: FRONTEND SECURITY

### Test 1: Secure Headers

**FILE: netlify.toml (or vercel.json)**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co;
      frame-ancestors 'none';
    """
```

**Test Headers:**
```bash
# After deployment
curl -I https://your-app.com

# Should see security headers in response
```

### Test 2: Dependency Vulnerabilities

```bash
# Check for known vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# If critical vulnerabilities remain
npm audit fix --force
# (Review changes carefully)
```

**Expected:**
- ✅ 0 critical vulnerabilities
- ✅ 0 high vulnerabilities
- ⚠️ Low/moderate acceptable if not exploitable

### Test 3: Sensitive Data Exposure

**Check for exposed data in:**

1. **Browser DevTools → Network**
   - ✅ No passwords in request bodies (should be encrypted)
   - ✅ No API keys in headers
   - ✅ Tokens only in Authorization header

2. **Browser DevTools → Application → Local Storage**
   - ✅ No sensitive data stored unencrypted
   - ✅ Only Supabase session tokens

3. **Console Logs**
   - ✅ No sensitive data logged
   - ✅ Production build has console.log removed

---

## PART 6: PAYMENT SECURITY

### Test 1: Payment Flow Security

**Critical Checks:**

1. **Amount Manipulation**
   ```javascript
   // Try to modify amount in browser DevTools before payment
   // Expected: Server-side validation should reject
   ```

2. **Payment Status Verification**
   ```sql
   -- After payment, verify status in database matches gateway response
   SELECT * FROM transactions 
   WHERE id = 'transaction_id';
   -- Status should match actual payment gateway status
   ```

3. **Idempotency**
   ```javascript
   // Try to submit same payment twice
   // Expected: Second attempt should be rejected or return same result
   ```

**Implement Payment Security:**

FILE: src/lib/payment.ts
```typescript
import { supabase } from './supabase';
import crypto from 'crypto';

export async function verifyPayment(
  transactionId: string,
  amount: number,
  signature: string
) {
  // Verify payment signature from gateway
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PAYMENT_SECRET!)
    .update(`${transactionId}:${amount}`)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    throw new Error('Invalid payment signature');
  }
  
  // Double-check amount in database
  const { data: contract } = await supabase
    .from('contracts')
    .select('amount')
    .eq('id', transactionId)
    .single();
  
  if (contract?.amount !== amount) {
    throw new Error('Amount mismatch');
  }
  
  return true;
}
```

---

## PART 7: SECURITY CHECKLIST

### Pre-Deployment Security Audit

```markdown
## Authentication & Authorization
- [ ] Passwords hashed (handled by Supabase)
- [ ] Session tokens secure (httpOnly, sameSite)
- [ ] OAuth properly configured
- [ ] Protected routes working
- [ ] RLS policies tested

## Data Security
- [ ] Profile data access controlled
- [ ] Job access controlled by ownership
- [ ] Proposal confidentiality enforced
- [ ] Message privacy enforced
- [ ] Financial data protected

## Input Validation
- [ ] XSS prevention tested
- [ ] SQL injection protection verified
- [ ] File upload validation working
- [ ] Form validation on all inputs

## API Security
- [ ] Rate limiting in place
- [ ] CORS properly configured
- [ ] API keys not exposed
- [ ] Environment variables secure

## Frontend Security
- [ ] Security headers configured
- [ ] No dependency vulnerabilities
- [ ] No sensitive data in console/storage
- [ ] CSP policy defined

## Payment Security (if applicable)
- [ ] Amount manipulation prevented
- [ ] Payment verification working
- [ ] Idempotency enforced
- [ ] SSL/TLS enabled

## Monitoring
- [ ] Error tracking (Sentry) configured
- [ ] Audit logs enabled (Supabase)
- [ ] Security alerts set up

## Compliance (if applicable)
- [ ] GDPR compliance (data export/deletion)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent (if EU users)
```

---

## PART 8: SECURITY TESTING SCRIPT

### Automated Security Test

FILE: scripts/security-test.js
```javascript
const axios = require('axios');

async function testSecurity() {
  const baseUrl = 'http://localhost:5173';
  const results = [];

  // Test 1: XSS in form
  try {
    const xssPayload = '<script>alert("XSS")</script>';
    const response = await axios.post(`${baseUrl}/api/jobs`, {
      title: xssPayload,
    });
    
    if (response.data.title.includes('<script>')) {
      results.push({ test: 'XSS Prevention', status: 'FAIL', severity: 'HIGH' });
    } else {
      results.push({ test: 'XSS Prevention', status: 'PASS' });
    }
  } catch (error) {
    results.push({ test: 'XSS Prevention', status: 'PASS' });
  }

  // Test 2: Unauthorized access
  try {
    const response = await axios.get(`${baseUrl}/api/admin`, {
      headers: {} // No auth token
    });
    
    if (response.status === 200) {
      results.push({ test: 'Unauthorized Access', status: 'FAIL', severity: 'CRITICAL' });
    }
  } catch (error) {
    if (error.response?.status === 401) {
      results.push({ test: 'Unauthorized Access', status: 'PASS' });
    }
  }

  // Test 3: Rate limiting
  const requests = [];
  for (let i = 0; i < 100; i++) {
    requests.push(axios.get(`${baseUrl}/api/jobs`));
  }
  
  try {
    await Promise.all(requests);
    results.push({ test: 'Rate Limiting', status: 'WARN', note: 'No rate limit detected' });
  } catch (error) {
    if (error.response?.status === 429) {
      results.push({ test: 'Rate Limiting', status: 'PASS' });
    }
  }

  // Print results
  console.log('\n=== Security Test Results ===\n');
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.severity) console.log(`   Severity: ${result.severity}`);
    if (result.note) console.log(`   Note: ${result.note}`);
  });

  const failures = results.filter(r => r.status === 'FAIL');
  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} critical security issues found!`);
    process.exit(1);
  } else {
    console.log('\n✅ All security tests passed!');
  }
}

testSecurity();
```

---

## 📊 SECURITY AUDIT REPORT TEMPLATE

```markdown
# Security Audit Report
Date: {{DATE}}
Auditor: {{NAME}}
Application: Khedma.tn

## Executive Summary
Overall Security Score: __/100

## Critical Issues
- [ ] None found

## High Priority Issues
- [ ] None found

## Medium Priority Issues
- [ ] None found

## Test Results

### Authentication (Pass/Fail)
- [x] Password security
- [x] Session management
- [x] OAuth security
- [x] Logout functionality

### Authorization (Pass/Fail)
- [x] RLS on profiles
- [x] RLS on jobs
- [x] RLS on proposals
- [x] RLS on messages
- [x] RLS on financial data

### Input Validation (Pass/Fail)
- [x] XSS prevention
- [x] SQL injection prevention
- [x] File upload validation

### API Security (Pass/Fail)
- [x] Rate limiting
- [x] CORS configuration
- [x] Environment variables

### Frontend Security (Pass/Fail)
- [x] Security headers
- [x] Dependencies audit
- [x] No sensitive data exposure

## Recommendations
1. [List any recommendations]

## Ready for Production
Status: [ ] YES [ ] NO

Blockers: [None] or [List]
```

---

## 🚀 Next Steps

After security audit passes:
1. Proceed to PHASE 4: Production Deployment
2. Set up continuous security monitoring
3. Schedule regular security audits (quarterly)
