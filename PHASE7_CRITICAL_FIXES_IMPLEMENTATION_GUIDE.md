# PHASE 7 CRITICAL FIXES - IMPLEMENTATION GUIDE

## Quick Summary

**Current Status**: Production readiness score **72/100** - NOT PRODUCTION READY

**Goal**: Fix 4 CRITICAL BLOCKERS (30 hours) + 8 HIGH PRIORITY issues (20 hours) = 50 hours total work

**Blockers that must be fixed BEFORE production deployment**:
1. Secrets exposed in git history (IMMEDIATE)
2. No health check endpoints
3. No automated backups
4. Load tests not executed

---

## CRITICAL BLOCKER #1: REMOVE SECRETS FROM GIT HISTORY (2 hours) ⚠️ IMMEDIATE

### What needs to be done:
- `.env.local` file is committed to git with production secrets exposed
- Vercel OIDC token, Supabase keys visible in git history
- Must be removed and all keys rotated

### Implementation steps:

**Step 1: Remove from git history**
```bash
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env.local' --prune-empty --tag-name-filter cat -- --all
```

**Step 2: Force push (DANGEROUS but necessary)**
```bash
git push origin --force --all
```

**Step 3: Rotate all Supabase keys**
- Go to Supabase console → Project settings → API Keys
- Generate new anon key
- Generate new service role key
- Update `.env.local` with new keys

**Step 4: Rotate Vercel OIDC token**
- Go to Vercel → Settings → Tokens
- Generate new token
- Update environment variables

**Step 5: Add to .gitignore (verify it's there)**
```
.env.local
.env.*.local
```

**Step 6: Audit git history**
```bash
git log --all --pretty=format: --name-only | sort -u | grep -E "\.env|secrets|key"
```

### Files to check/modify:
- `.env.local` (DELETE from git, keep locally)
- `.gitignore` (ADD .env.local if not present)

### Verification:
- `git log --all --grep="env"` should find nothing sensitive
- `git show` on random commits should not expose secrets

### Effort: 2 hours
### Severity: 🔴 CRITICAL - DO FIRST

---

## CRITICAL BLOCKER #2: CREATE HEALTH CHECK ENDPOINTS (4 hours)

### What needs to be done:
- Create 3 API endpoints for monitoring: `/health`, `/ready`, `/live`
- These are required for production monitoring and kubernetes/load balancer integration
- Currently missing entirely

### Implementation steps:

**Step 1: Create health check service**

Create `src/lib/healthCheck.ts`:
```typescript
import { supabase } from './supabase';

export async function checkDatabase(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function checkCache(): Promise<boolean> {
  // If using Redis/caching layer, check it here
  // For now, return true if no cache layer
  return true;
}

export async function checkStorage(): Promise<boolean> {
  try {
    // Try to list files in storage bucket
    const { error } = await supabase.storage
      .from('profiles')
      .list('', { limit: 1 });
    return !error;
  } catch {
    return false;
  }
}

export async function getHealthStatus() {
  const dbHealthy = await checkDatabase();
  const cacheHealthy = await checkCache();
  const storageHealthy = await checkStorage();

  return {
    status: (dbHealthy && cacheHealthy && storageHealthy) ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealthy,
      cache: cacheHealthy,
      storage: storageHealthy,
    },
  };
}
```

**Step 2: Create API route handlers**

Create `src/pages/api/health.ts`:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getHealthStatus } from '../../lib/healthCheck';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = await getHealthStatus();
    const statusCode = health.status === 'ok' ? 200 : 503;
    return res.status(statusCode).json(health);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

Create `src/pages/api/ready.ts`:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getHealthStatus } from '../../lib/healthCheck';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = await getHealthStatus();
  const ready = health.status === 'ok';
  
  return res.status(ready ? 200 : 503).json({
    ready,
    timestamp: new Date().toISOString(),
  });
}
```

Create `src/pages/api/live.ts`:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
}
```

**Step 3: Update Vercel configuration**

Update `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  },
  "functions": {
    "api/**/*.ts": {
      "memory": 3008,
      "maxDuration": 30
    }
  }
}
```

**Step 4: Test locally**
```bash
npm run dev
# In another terminal:
curl http://localhost:5173/api/health
curl http://localhost:5173/api/ready
curl http://localhost:5173/api/live
```

### Files to create/modify:
- `src/lib/healthCheck.ts` (NEW)
- `src/pages/api/health.ts` (NEW)
- `src/pages/api/ready.ts` (NEW)
- `src/pages/api/live.ts` (NEW)
- `vercel.json` (UPDATE with health check config if needed)

### Verification:
- `npm run build` should pass
- `npm run lint` should pass
- All 3 endpoints should return 200 when services are healthy

### Effort: 4 hours
### Severity: 🔴 CRITICAL - Required for production deployment

---

## CRITICAL BLOCKER #3: SET UP AUTOMATED BACKUPS (6 hours)

### What needs to be done:
- Currently only manual backups exist (monthly testing)
- Need automated daily backups with 30-day retention
- Backup verification and restore procedure needed

### Implementation steps:

**Step 1: Create backup script**

Create `scripts/backup-database.sh`:
```bash
#!/bin/bash

# Database backup script with rotation
BACKUP_DIR="./backups"
DB_URL="${SUPABASE_DB_CONNECTION_STRING}"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
pg_dump "$DB_URL" > "$BACKUP_DIR/$BACKUP_NAME"

echo "Backup created: $BACKUP_NAME"

# Rotate old backups (keep last 30 days)
find "$BACKUP_DIR" -name "backup-*.sql" -mtime +30 -delete

echo "Old backups cleaned up"
```

**Step 2: Set up GitHub Actions for automated backups**

Create `.github/workflows/backup-database.yml`:
```yaml
name: Automated Database Backup

on:
  schedule:
    # Run daily at 2:00 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create backup
        env:
          SUPABASE_DB_CONNECTION_STRING: ${{ secrets.SUPABASE_DB_CONNECTION_STRING }}
        run: |
          mkdir -p backups
          pg_dump "$SUPABASE_DB_CONNECTION_STRING" > "backups/backup-$(date +%Y%m%d-%H%M%S).sql"
      
      - name: Upload backup to artifact storage
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/
          retention-days: 30
      
      - name: Notify on failure
        if: failure()
        run: |
          echo "Backup failed!"
          exit 1
```

**Step 3: Set up Supabase managed backups**

- Go to Supabase console → Project settings → Backups
- Enable daily automated backups
- Set retention to 30 days minimum
- Configure backup notifications to Sentry

**Step 4: Create restore procedure**

Create `BACKUP_RESTORE_PROCEDURE.md`:
```markdown
# Backup Restore Procedure

## Automated Restore
1. Download backup file from GitHub Actions artifacts
2. Extract backup
3. Run: `psql $SUPABASE_DB_CONNECTION_STRING < backup-file.sql`

## Verification
After restore, verify data integrity:
```sql
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM jobs;
SELECT COUNT(*) FROM contracts;
SELECT COUNT(*) FROM messages;
```

## Rollback
If restore fails:
1. Stop all application traffic
2. Contact Supabase support for point-in-time recovery
3. Restore from previous backup
```

### Files to create/modify:
- `scripts/backup-database.sh` (NEW)
- `.github/workflows/backup-database.yml` (NEW)
- `BACKUP_RESTORE_PROCEDURE.md` (NEW/UPDATE)

### Verification:
- Backup workflow runs successfully
- Backup artifacts are stored with 30-day retention
- Manual restore test passes

### Effort: 6 hours
### Severity: 🔴 CRITICAL - Required before production

---

## CRITICAL BLOCKER #4: EXECUTE & ANALYZE LOAD TESTS (8 hours)

### What needs to be done:
- k6 load test scripts exist but have never been run
- Need to execute, analyze, and fix any bottlenecks
- Results must show system handles 1000 concurrent users

### Implementation steps:

**Step 1: Review existing k6 scripts**

Check `load-tests/` directory:
```bash
ls -la load-tests/
# Should see: job-listing.js, contract-payment.js, messaging.js, etc.
```

**Step 2: Set up k6 environment**

```bash
# Install k6 (if not already installed)
brew install k6  # macOS
# or download from https://k6.io/open-source/

# Create test configuration
cat > load-tests/test-config.js << 'EOF'
export const options = {
  vus: 100,           // Virtual users
  duration: '5m',     // 5 minute test
  rps: 1000,         // Requests per second
  ext: {
    loadimpact: {
      projectID: 3400000,
      name: 'khedma-tn load test'
    }
  }
};
EOF
```

**Step 3: Run load tests locally**

```bash
# Test job listing endpoint
k6 run load-tests/job-listing.js

# Test contract payment endpoint
k6 run load-tests/contract-payment.js

# Test messaging endpoint
k6 run load-tests/messaging.js
```

**Step 4: Analyze results and document**

Create `LOAD_TEST_RESULTS.md`:
```markdown
# Load Test Results

## Job Listing Endpoint
- Virtual Users: 100
- Duration: 5 minutes
- Average Response Time: XXms
- P95 Response Time: XXms
- Error Rate: X%
- Throughput: X req/sec

## Performance Assessment
- ✅ PASS: System handles 100 VU without degradation
- ❌ FAIL: Response times exceed SLA at 500 VU

## Bottlenecks Identified
1. Database query N+1 on job listing (cache required)
2. Missing database indexes on job search filters

## Remediation Steps
1. Add Redis caching layer for job listings
2. Create composite indexes on jobs table
```

**Step 5: Fix any identified bottlenecks**

Based on results, implement:
- Database query optimization
- Caching layer configuration
- Rate limiting implementation
- Connection pooling tuning

**Step 6: Rerun tests to verify improvements**

```bash
k6 run load-tests/job-listing.js  # Should show improvement
```

### Files to create/modify:
- `load-tests/` (EXECUTE existing scripts)
- `LOAD_TEST_RESULTS.md` (NEW - document results)
- `src/lib/cache.ts` (POSSIBLE - if caching needed)
- Database indexes (POSSIBLE - if optimization needed)

### Verification:
- All load tests pass without timeout errors
- Response times acceptable (P95 < 500ms)
- Error rate < 1%
- System stable under 1000 concurrent requests

### Effort: 8 hours
### Severity: 🔴 CRITICAL - Required before production

---

## HIGH PRIORITY ISSUES (8 issues, 20 hours total)

### Issue #1: Configure Production Monitoring & Alerting (12 hours)

**Current State**: Sentry configured but 10% sample rate, no dashboard

**What to do**:
- Increase Sentry sample rate to 100% for production
- Create Sentry dashboard for critical errors
- Set up email alerts for 🔴 level errors
- Integrate PagerDuty for on-call alerts
- Configure log aggregation (CloudWatch/Datadog)

**Files**: `src/lib/sentry.ts`, `vercel.json`

---

### Issue #2: Set up Automated Rollback (4 hours)

**Current State**: Manual rollback via Vercel UI only

**What to do**:
- Create GitHub Actions workflow for automatic rollback on deploy failure
- Configure health check integration for rollback trigger
- Document rollback procedure
- Test rollback in staging environment

**Files**: `.github/workflows/rollback.yml`, `ROLLBACK_PROCEDURE.md`

---

### Issue #3: Implement API Rate Limiting (6 hours)

**Current State**: No backend rate limiting on API endpoints

**What to do**:
- Implement rate limiting middleware on all API routes
- Use Redis for distributed rate limiting (or Supabase-based if Redis not available)
- Different limits for authenticated vs public endpoints
- Return 429 status with retry-after header

**Files**: `src/lib/rateLimit.ts`, `src/pages/api/middleware.ts`

---

### Issue #4-8: Additional High Priority Issues

- **#4**: Complete deployment checklist documentation
- **#5**: Define RTO/RPO targets
- **#6**: Instrument analytics events
- **#7**: Set up production logging strategy
- **#8**: Configure CDN cache headers optimization

---

## Summary: What to give the other agent

Copy/paste this section when working with the other agent:

---

## TASK FOR AGENT: Phase 7 Critical Fixes Implementation

**Goal**: Implement Phase 7 critical blockers and high-priority issues for production readiness

**Critical Blockers (DO THESE FIRST - 30 hours total)**:

1. **Remove secrets from git & rotate keys** (2h)
   - Remove `.env.local` from git history using filter-branch
   - Force push to reset git history
   - Rotate Supabase anon key, service role key, Vercel OIDC token
   - Verify `.env.local` in .gitignore

2. **Create health check endpoints** (4h)
   - Create `src/lib/healthCheck.ts` with database, cache, storage checks
   - Create `/api/health`, `/api/ready`, `/api/live` endpoints
   - Update Vercel config for health check integration
   - Test locally with `curl`

3. **Set up automated backups** (6h)
   - Create backup script in `scripts/backup-database.sh`
   - Set up GitHub Actions workflow for daily backups
   - Enable Supabase managed backups with 30-day retention
   - Create and test restore procedure

4. **Execute load tests** (8h)
   - Run existing k6 scripts in `load-tests/` directory
   - Analyze results and document in `LOAD_TEST_RESULTS.md`
   - Fix any identified bottlenecks (query optimization, caching, indexes)
   - Rerun tests to verify improvements

**After completion, return here with summary of:**
- ✅ What was completed
- ❌ What failed and why
- 📊 Test results/metrics
- 🔄 Any manual follow-ups needed

---

## Files provided for reference:

- `PHASE7_DEPLOYMENT_AUDIT.md` - Full detailed audit (612 lines)
- `PHASE6_TESTING_COVERAGE_AUDIT.md` - Testing status (191/191 tests passing)

Good luck! Report back when done.
