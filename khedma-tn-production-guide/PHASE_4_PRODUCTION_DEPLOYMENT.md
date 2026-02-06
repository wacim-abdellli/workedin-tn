# PHASE 4: PRODUCTION DEPLOYMENT

## 🎯 Objective
Deploy Khedma.tn to production with zero downtime and proper monitoring.

---

## PART 1: PRE-DEPLOYMENT CHECKLIST

### Environment Preparation

#### ✅ Task 1: Verify All Tests Pass

```bash
# Run all checks
npm run lint           # No critical errors
npx tsc --noEmit      # No TypeScript errors
npm run build         # Build succeeds
npm run preview       # Preview works
```

Expected: All commands exit with code 0

#### ✅ Task 2: Clean Up Development Code

```bash
# Remove all console.log (should already be done)
grep -r "console.log" src/
# Expected: 0 results (or only logger.* calls)

# Remove all TODO comments
grep -r "TODO\|FIXME" src/
# Expected: 0 results

# Remove debug code
grep -r "debugger" src/
# Expected: 0 results
```

#### ✅ Task 3: Update Version

FILE: package.json
```json
{
  "name": "khedma-tn",
  "version": "1.0.0",  // ← Update this
  "description": "Tunisian Freelancer Marketplace"
}
```

#### ✅ Task 4: Generate Production Build

```bash
# Build for production
npm run build

# Check build output
ls -lh dist/

# Verify files exist
# ✅ dist/index.html
# ✅ dist/assets/*.js
# ✅ dist/assets/*.css
```

#### ✅ Task 5: Test Production Build Locally

```bash
# Serve production build
npm run preview

# Open http://localhost:4173
# Test all critical flows:
# - Login/Signup
# - Onboarding
# - Job posting
# - Proposal submission
# - Real-time chat
```

---

## PART 2: DATABASE PRODUCTION SETUP

### Supabase Production Configuration

#### Step 1: Create Production Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: "khedma-tn-production"
4. Region: Closest to Tunisia (e.g., Frankfurt or Paris)
5. Database Password: Generate strong password, save in password manager

#### Step 2: Run Migrations

```bash
# Connect to production database
# Copy connection string from Supabase dashboard

# Run all migrations in order
psql "YOUR_PRODUCTION_CONNECTION_STRING" -f supabase/migrations/001_initial_schema.sql
psql "YOUR_PRODUCTION_CONNECTION_STRING" -f supabase/migrations/002_rls_policies.sql
# ... (run all 11 migrations)

# Or use Supabase CLI
supabase db push --db-url "YOUR_PRODUCTION_CONNECTION_STRING"
```

#### Step 3: Verify Schema

```sql
-- Connect to production database and verify

-- 1. Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Expected: 15+ tables

-- 2. Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
-- Expected: All tables have rowsecurity = true

-- 3. Check storage buckets
SELECT * FROM storage.buckets;
-- Expected: avatars, portfolios, voice-intros

-- 4. Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public';
-- Expected: 20+ indexes
```

#### Step 4: Configure Auth

In Supabase Dashboard:

1. **Authentication → Providers**
   - ✅ Email: Enabled
   - ✅ Google OAuth: Enabled
     - Client ID: [Your production OAuth Client ID]
     - Client Secret: [Your production OAuth Secret]
     - Authorized Redirect URIs: `https://your-domain.com/auth/callback`

2. **Authentication → URL Configuration**
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/*`

3. **Authentication → Email Templates**
   - Customize confirmation email
   - Customize password reset email
   - Add your logo and branding

#### Step 5: Configure Storage

1. **Storage → Buckets → avatars**
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

2. **Storage → Buckets → portfolios**
   - Public: Yes
   - File size limit: 10MB
   - Allowed MIME types: image/*, application/pdf

3. **Storage → Buckets → voice-intros**
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: audio/mpeg, audio/wav, audio/webm

---

## PART 3: HOSTING PLATFORM SETUP

### Option A: Vercel Deployment

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login

```bash
vercel login
```

#### Step 3: Configure Project

FILE: vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

#### Step 4: Set Environment Variables

```bash
# Via CLI
vercel env add VITE_SUPABASE_URL production
# Paste your production Supabase URL

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste your production anon key

vercel env add VITE_SENTRY_DSN production
# (Optional) Paste Sentry DSN
```

Or via Vercel Dashboard:
1. Go to project settings
2. Environment Variables
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SENTRY_DSN` (optional)

#### Step 5: Deploy

```bash
# Deploy to production
vercel --prod

# Get deployment URL
# Example: https://khedma-tn-production.vercel.app
```

#### Step 6: Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add khedma.tn

# Follow DNS instructions
# Add CNAME record: www.khedma.tn → cname.vercel-dns.com
# Add A record: khedma.tn → 76.76.21.21
```

---

### Option B: Netlify Deployment

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login

```bash
netlify login
```

#### Step 3: Configure Project

FILE: netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[build.environment]
  NODE_VERSION = "18"
```

#### Step 4: Deploy

```bash
# Initialize Netlify site
netlify init

# Deploy to production
netlify deploy --prod

# Set environment variables
netlify env:set VITE_SUPABASE_URL "your_url"
netlify env:set VITE_SUPABASE_ANON_KEY "your_key"
```

---

## PART 4: MONITORING & ERROR TRACKING

### Setup Sentry (Recommended)

#### Step 1: Create Sentry Account

1. Go to https://sentry.io
2. Create project: "khedma-tn"
3. Platform: React
4. Copy DSN

#### Step 2: Configure Sentry

FILE: src/lib/sentry.ts (already created in Phase 10.2)
```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.MODE === 'production') {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1, // 10% of transactions
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  }
}
```

#### Step 3: Verify Sentry Works

After deployment:
1. Visit your production site
2. Trigger an error intentionally:
   ```javascript
   // In browser console
   throw new Error('Test Sentry error');
   ```
3. Check Sentry dashboard
4. ✅ Error should appear within 1 minute

---

### Setup Analytics (Optional)

#### Google Analytics 4

FILE: index.html
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Or use: https://www.npmjs.com/package/react-ga4

---

## PART 5: DNS & SSL CONFIGURATION

### DNS Setup (for custom domain)

#### Step 1: Purchase Domain

Recommended registrars:
- Namecheap
- GoDaddy
- Google Domains

#### Step 2: Configure DNS Records

In your domain registrar's DNS settings:

```
Type    Name    Value                           TTL
A       @       76.76.21.21 (Vercel)           3600
CNAME   www     cname.vercel-dns.com           3600

Or for Netlify:
A       @       75.2.60.5                       3600
CNAME   www     your-site.netlify.app          3600
```

#### Step 3: Wait for Propagation

```bash
# Check DNS propagation
dig khedma.tn
dig www.khedma.tn

# Or use online tool
# https://www.whatsmydns.net/
```

Expected: ~1-24 hours for global propagation

#### Step 4: SSL Certificate

Both Vercel and Netlify provide automatic SSL:
- ✅ SSL certificate provisioned automatically
- ✅ HTTP → HTTPS redirect enabled
- ✅ Certificate auto-renewal

Verify:
```bash
# Check SSL
curl -I https://khedma.tn

# Should see:
# HTTP/2 200
# strict-transport-security: max-age=31536000
```

---

## PART 6: POST-DEPLOYMENT VERIFICATION

### Critical Path Testing

#### Test 1: Homepage

```bash
# Check homepage loads
curl -I https://khedma.tn

# Expected: HTTP 200
```

Browser test:
1. Open https://khedma.tn
2. ✅ Page loads < 3 seconds
3. ✅ Images load
4. ✅ No console errors
5. ✅ RTL layout correct (for Arabic)

#### Test 2: Authentication

1. Click "تسجيل" (Signup)
2. Create new account
3. ✅ Email confirmation sent (if enabled)
4. ✅ Can login
5. ✅ Session persists on refresh
6. ✅ Can logout

#### Test 3: Database Connectivity

1. After login, check profile loads
2. ✅ Profile data displays
3. ✅ No "database connection error"
4. ✅ Real-time features work (if applicable)

#### Test 4: File Upload

1. Go to profile settings
2. Upload avatar
3. ✅ Upload succeeds
4. ✅ Image displays
5. ✅ Image accessible via URL

#### Test 5: Payment Flow (Critical!)

**If using real payment gateway:**
1. Create test transaction
2. ✅ Payment page loads
3. ✅ Payment processes
4. ✅ Webhook received
5. ✅ Database updated
6. ✅ User balance reflects change

**Note:** Test with small amounts first!

---

## PART 7: MONITORING SETUP

### Uptime Monitoring

#### Option 1: UptimeRobot (Free)

1. Go to https://uptimerobot.com
2. Add monitor:
   - Type: HTTPS
   - URL: https://khedma.tn
   - Interval: 5 minutes
3. Add alert contacts (email, SMS)

#### Option 2: Pingdom

Similar setup, more detailed reports

### Performance Monitoring

#### Lighthouse CI (Automated)

FILE: .github/workflows/lighthouse.yml
```yaml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://khedma.tn
            https://khedma.tn/jobs
          uploadArtifacts: true
```

---

## PART 8: BACKUP & DISASTER RECOVERY

### Database Backups

#### Automatic Backups (Supabase)

Supabase provides automatic daily backups on paid plans.

To enable:
1. Go to Supabase Dashboard
2. Settings → Backups
3. Enable daily backups
4. Retention: 7 days (or more)

#### Manual Backup

```bash
# Export database
pg_dump "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" > backup.sql

# Automate with cron (on your server)
0 2 * * * pg_dump "CONNECTION_STRING" > /backups/khedma-$(date +\%Y\%m\%d).sql
```

### Code Backups

Already handled by Git:
- ✅ Code on GitHub/GitLab
- ✅ Tagged releases
- ✅ Can rollback anytime

---

## PART 9: ROLLBACK PLAN

### If Deployment Fails

#### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

Or via Vercel Dashboard:
1. Go to project deployments
2. Find previous working deployment
3. Click "Promote to Production"

#### Netlify Rollback

Via Netlify Dashboard:
1. Go to Deploys
2. Find previous deploy
3. Click "Publish deploy"

### If Database Migration Fails

```sql
-- Rollback last migration
-- If you have migration tracking table
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 1;

-- Manually revert changes
-- (Keep migration rollback scripts ready)
```

---

## PART 10: LAUNCH CHECKLIST

### Final Pre-Launch Checklist

```markdown
## Code Quality
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console.log statements
- [ ] No TODO comments
- [ ] Production build succeeds

## Database
- [ ] All migrations run
- [ ] RLS policies tested
- [ ] Indexes created
- [ ] Backups enabled

## Security
- [ ] SSL certificate active
- [ ] Security headers configured
- [ ] Environment variables set
- [ ] No secrets in code
- [ ] Authentication working
- [ ] Authorization tested

## Performance
- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB
- [ ] Images optimized
- [ ] Lazy loading enabled
- [ ] CDN configured

## Monitoring
- [ ] Sentry configured
- [ ] Uptime monitoring active
- [ ] Analytics tracking
- [ ] Error alerts set up

## Content
- [ ] Terms of service published
- [ ] Privacy policy published
- [ ] FAQ page complete
- [ ] Contact information visible

## Testing
- [ ] All 5 user flows tested
- [ ] Payment flow tested
- [ ] Mobile responsive
- [ ] RTL layout working
- [ ] Cross-browser tested (Chrome, Firefox, Safari)

## Business
- [ ] Domain configured
- [ ] Email configured (for notifications)
- [ ] Payment gateway configured
- [ ] Customer support ready
- [ ] Marketing materials ready

## Launch Day
- [ ] Monitor error rates
- [ ] Monitor uptime
- [ ] Monitor user signups
- [ ] Monitor payment flow
- [ ] Be ready for hotfixes
```

---

## PART 11: POST-LAUNCH MONITORING

### Week 1 Monitoring Plan

#### Day 1 (Launch Day)
- ✅ Monitor every hour
- ✅ Check error rates in Sentry
- ✅ Check uptime
- ✅ Monitor database performance
- ✅ Watch user signups
- ✅ Test critical flows yourself

#### Day 2-7
- ✅ Monitor twice daily
- ✅ Review error reports
- ✅ Check user feedback
- ✅ Optimize based on real data
- ✅ Fix any critical bugs immediately

### Key Metrics to Track

```javascript
// Track in analytics
const keyMetrics = {
  // User metrics
  signupsPerDay: 0,
  activeUsers: 0,
  conversionRate: 0, // signup → onboarded
  
  // Technical metrics
  errorRate: 0,
  averageLoadTime: 0,
  uptimePercentage: 0,
  
  // Business metrics
  jobsPosted: 0,
  proposalsSubmitted: 0,
  contractsCreated: 0,
  paymentsProcessed: 0,
};
```

---

## 📊 DEPLOYMENT REPORT TEMPLATE

```markdown
# Production Deployment Report
Date: {{DATE}}
Version: 1.0.0
Deployed By: {{NAME}}

## Deployment Details
- Platform: Vercel / Netlify
- Domain: https://khedma.tn
- Database: Supabase Production
- Build Time: X minutes
- Deploy Status: ✅ SUCCESS

## Post-Deployment Checks
- [x] Homepage loads
- [x] Authentication works
- [x] Database connected
- [x] File uploads work
- [x] Payment flow works
- [x] SSL active
- [x] Monitoring active

## Issues Encountered
- None / [List any issues and how they were resolved]

## Performance Metrics
- Lighthouse Score: 95
- Load Time: 1.8s
- Bundle Size: 425 KB

## Next Steps
- Monitor for 24 hours
- Collect user feedback
- Plan first iteration

## Sign-off
Deployment approved by: {{NAME}}
Date: {{DATE}}
```

---

## 🎉 CONGRATULATIONS!

Your Khedma.tn application is now LIVE in production!

### Next Actions:
1. Monitor closely for first 48 hours
2. Gather user feedback
3. Plan first iteration of improvements
4. Scale as needed

### Support Resources:
- Supabase Status: https://status.supabase.com
- Vercel Status: https://www.vercel-status.com
- Sentry Dashboard: Your Sentry URL

---

**Your app is production-ready! 🚀**
