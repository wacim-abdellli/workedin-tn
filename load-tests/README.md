# Load Testing — Khedma TN

Pre-launch load tests using [k6](https://k6.io) to validate performance and identify bottlenecks.

## Install k6

```bash
# Windows (Chocolatey)
choco install k6

# macOS (Homebrew)
brew install k6

# Docker
docker pull grafana/k6

# Or download from: https://k6.io/docs/get-started/installation/
```

## Test Scripts

| Script | VUs | Duration | What It Tests |
|--------|-----|----------|---------------|
| `job-board.js` | 100 | 30s | Homepage + job board + freelancers browsing |
| `proposal-submit.js` | 20 | 30s | Concurrent API load + rate limiting |

## Running Tests

```bash
# Against Vercel preview (recommended — do NOT run against production)
k6 run --env BASE_URL=https://khedma-tn-preview.vercel.app load-tests/job-board.js

# Against local dev
k6 run --env BASE_URL=http://localhost:5173 load-tests/job-board.js

# With Supabase API tests
k6 run \
  --env BASE_URL=https://khedma-tn-preview.vercel.app \
  --env SUPABASE_URL=https://your-project.supabase.co \
  --env SUPABASE_ANON_KEY=your-anon-key \
  load-tests/proposal-submit.js
```

## Thresholds

| Metric | Target |
|--------|--------|
| Response time (p95) | < 2s (job board), < 3s (proposals) |
| Error rate | < 1% (browsing), < 5% (proposals) |
| 5xx errors | 0 |

## Baseline Results

> **Status: Pending first run**
>
> Run the tests against your Vercel preview URL and update this section with results.

### Template for results:

```
Date: YYYY-MM-DD
Target: https://khedma-tn-preview.vercel.app

job-board.js:
  - VUs: 100, Duration: 30s
  - p95 response time: ___ms
  - Error rate: ___%
  - Total requests: ___

proposal-submit.js:
  - VUs: 20, Duration: 30s
  - p95 response time: ___ms
  - Error rate: ___%
  - Rate limiting triggered: yes/no
```

## Supabase Bottleneck Checklist

After running tests, check:

- [ ] Connection pool not exhausted (Supabase dashboard → Database → Connections)
- [ ] No slow queries in Supabase logs (> 500ms)
- [ ] RLS policies not causing sequential scans (check `EXPLAIN ANALYZE`)
- [ ] Indexes exist on: `jobs.created_at`, `proposals.job_id`, `transactions.status+created_at`
- [ ] Edge Functions cold start < 1s

## Recommended Indexes (if slow queries found)

```sql
-- If job board browsing is slow
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- If proposal queries are slow
CREATE INDEX IF NOT EXISTS idx_proposals_job_id ON proposals(job_id);

-- If stuck transaction queries are slow
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at);
```
