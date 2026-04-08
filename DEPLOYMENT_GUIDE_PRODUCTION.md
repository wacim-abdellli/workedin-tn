# Khedma-TN Production Deployment Guide

**Last Updated:** March 31, 2026  
**Status:** Ready for Production  
**Estimated Duration:** 1-2 hours (with 24-hour monitoring window)  

---

## 🎯 Pre-Production Requirements

### ✅ Mandatory Pre-Checks

Before ANY production deployment:

- [ ] Staging deployment verified for minimum 24-48 hours
- [ ] All QA sign-offs received
- [ ] No critical/high priority issues in staging
- [ ] Database backups created and tested
- [ ] Rollback plan documented and tested
- [ ] Monitoring and alerts configured
- [ ] Production environment variables verified
- [ ] SSL/TLS certificates valid and renewed
- [ ] CDN and caching configured
- [ ] Email service secrets set in Supabase Edge Function secrets (Resend)
- [ ] Payment processor production credentials in place
- [ ] All team members aware of deployment window
- [ ] Incident response team on standby

### Security Checklist

- [ ] RLS policies verified in production database (run AUDIT_RLS.sql)
- [ ] Secrets rotated and not in code
- [ ] HTTPS enforced (force redirect from HTTP)
- [ ] CORS settings properly configured
- [ ] Rate limiting enabled on API endpoints
- [ ] Admin panel restricted to authorized IPs
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] WAF rules in place
- [ ] DDoS protection enabled

---

## 📋 Production Environment Configuration

### 1. **Production Environment Variables**

Create `.env.production` (or set via Vercel dashboard → Environment Variables):

```env
# Supabase Production
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Analytics (optional)
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Sentry Error Tracking (optional)
VITE_SENTRY_DSN=your-sentry-dsn
```

> ⚠️ **Email and payment credentials are server-side secrets only.**
> Do NOT add `VITE_SENDGRID_*`, `VITE_FLOUCI_*`, or `VITE_RESEND_*` variables.
> Set these via Supabase CLI against the production project ref:
> ```bash
> supabase secrets set RESEND_API_KEY=your-resend-key --project-ref <ref>
> supabase secrets set FLOUCI_APP_TOKEN=your-flouci-token --project-ref <ref>
> supabase secrets set FLOUCI_APP_SECRET=your-flouci-secret --project-ref <ref>
> ```

### 2. **Database Preparation**

Ensure production database is ready:

```bash
# Verify all migrations applied
supabase db list-migrations --project-id production

# Run final migrations (if any new ones)
supabase db push --project-id production

# Verify RLS policies
psql -U postgres \
  -h your-production-db.supabase.co \
  -d postgres \
  -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';"

# Verify admin users exist (is_admin set in profiles table by service role)
psql -U postgres \
  -h your-production-db.supabase.co \
  -d postgres \
  -c "SELECT id, email FROM auth.users WHERE id IN (SELECT id FROM public.profiles WHERE is_admin = true);"
```

### 3. **CDN & Cache Configuration**

```bash
# Configure Cloudflare (or your CDN)
# Set cache rules:
- Static assets (*.js, *.css, *.svg): 30 days
- HTML files: 1 day
- API endpoints: No cache
- Images: 7 days

# Purge old cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -d '{"purge_everything":true}'
```

---

## 🚀 Deployment Steps

### **Phase 1: Pre-Flight (1 Hour Before)**

1. **Lock deployments** (notify team no other deploys)
2. **Create database backup**
   ```bash
   pg_dump -h your-production-db.supabase.co \
     -U postgres \
     -d postgres \
     -F c -b -v \
     -f backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Verify monitoring is ready**
   ```bash
   # Check all monitoring services responding
   curl https://monitoring.yourdomain.com/health
   curl https://sentry.io/api/health/
   ```

4. **Start incident channel** (Slack/Discord)
   - Post deployment plan
   - Expected downtime (if any)
   - Point of contact

### **Phase 2: Deploy (10-15 Minutes)**

#### **Option A: Vercel Production**

```bash
# Verify build succeeds
npm run build

# Deploy to production
vercel deploy --prod

# Or via dashboard: Vercel → Deploy
```

#### **Option B: Docker/Kubernetes**

```bash
# Build and push Docker image
docker build -f Dockerfile -t khedma:latest .
docker tag khedma:latest your-registry/khedma:$(date +%Y%m%d-%H%M%S)
docker tag khedma:latest your-registry/khedma:latest
docker push your-registry/khedma:latest

# Deploy to Kubernetes
kubectl set image deployment/khedma \
  khedma=your-registry/khedma:latest \
  --record

# Wait for rollout
kubectl rollout status deployment/khedma
```

#### **Option C: Manual VPS**

```bash
# SSH into production server
ssh deploy@khedma.tn

# Navigate to app directory
cd /var/www/khedma

# Backup current version
cp -r dist dist.backup.$(date +%Y%m%d-%H%M%S)

# Pull latest code
git pull origin main
npm ci
npm run build

# Verify build succeeded
ls -la dist/index.html

# Restart with PM2
pm2 restart khedma --update-env
pm2 save
```

### **Phase 3: Verification (15-30 Minutes)**

1. **Check Deployment Status**
   ```bash
   # Vercel
   vercel list-deployments
   
   # Kubernetes
   kubectl get pods -l app=khedma
   kubectl logs -f deployment/khedma
   
   # VPS
   pm2 status
   pm2 logs khedma
   ```

2. **Smoke Tests**
   ```bash
   # Test homepage
   curl -I https://khedma.tn/
   
   # Test API
   curl https://khedma.tn/api/health
   
   # Test Supabase connection (in browser console)
   # Sign in and verify chat works
   ```

3. **Security Verification**
   ```bash
   # Verify the full response-header baseline and write an audit artifact
   npm run headers:verify -- \
     --base-url https://khedma.tn \
     --label production \
     --output artifacts/security-headers/production.json

   # Repeat against staging before promoting the release
   npm run headers:verify -- \
     --base-url https://<current-vercel-preview-url> \
     --label staging \
     --output artifacts/security-headers/staging.json
   ```

4. **Real-Time Features Test**
   - Open app in 2 browser windows
   - Send test message from one window
   - Verify other window receives in < 1 second
   - Check console for no errors

---

## 📊 24-Hour Monitoring Protocol

### **Hour 1: Intense Monitoring**

Every 5 minutes check:

```bash
# Application health
curl -s https://khedma.tn/api/health | jq '.status'

# Error rate (check monitoring dashboard)
# Should be < 0.1% error rate

# Response time (should be < 500ms)
curl -w "@curl-format.txt" -o /dev/null -s https://khedma.tn/

# Real-time sync (WebSocket)
# Test in browser: console should show successful connection
```

### **Hours 2-4: Active Monitoring**

Every 15 minutes check:
- [ ] Error logs for FATAL or CRITICAL
- [ ] Database response time (< 100ms)
- [ ] API response time (< 500ms)
- [ ] Real-time message delivery (< 1s)
- [ ] User sign-ups completing successfully

### **Hours 5-24: Standard Monitoring**

Every hour:
- [ ] Error rate
- [ ] Performance metrics
- [ ] User activity metrics
- [ ] Payment transactions completing

### **Key Metrics Dashboard**

Set up monitoring to track:

```
Request Rate: 
  ├─ Target: > 100 req/sec
  └─ Alert if < 10 req/sec (traffic drop) or > 1000 (spike)

Error Rate:
  ├─ Target: < 0.5%
  └─ Alert if > 5%

Response Time (P95):
  ├─ Target: < 1 second
  └─ Alert if > 3 seconds

Database Queries:
  ├─ Target: < 100ms
  └─ Alert if > 500ms

WebSocket Connections:
  ├─ Target: Active connections > 10
  └─ Alert if < 5 for > 5 min

Payment Transactions:
  ├─ Target: 100% completion
  └─ Alert if success rate < 99%
```

---

## 🔄 Post-Deployment Communication

### 1. **Send Status Update** (After 1 hour)

```
Subject: Production Deployment Complete ✅

Deployment completed successfully at [timestamp]
- Application version: [version]
- Monitoring: All green
- Performance: [metrics]
- Zero critical errors

Status: STABLE
```

### 2. **Send Daily Report** (24 hours after)

```
Report: Production Deployment Day 1

Uptime: 99.99%
Error Rate: 0.02%
Average Response Time: 245ms
Total Users: [count]
Transactions: [count]
Notable Events: None

Status: PRODUCTION STABLE
Recommendation: Monitor for 7 more days before full celebration
```

---

## 🔧 Production Rollback Procedure

If critical issues occur:

Canonical incident taxonomy, alert routes, and rollback checklist now live in `INCIDENT_READINESS.md`.

### **Immediate Actions (< 10 minutes)**

1. **Declare incident**
   ```
   Incident severity: CRITICAL
   Affected users: [estimate]
   Affected features: [list]
   Action: ROLLING BACK
   ```

2. **Initiate rollback**

   **Vercel:**
   ```bash
   vercel rollback
   ```

   **Kubernetes:**
   ```bash
   kubectl rollout undo deployment/khedma
   kubectl rollout status deployment/khedma
   ```

   **VPS:**
   ```bash
   cd /var/www/khedma
   rm -rf dist
   mv dist.backup.* dist
   pm2 restart khedma
   ```

3. **Verify rollback succeeded**
   ```bash
   curl -I https://khedma.tn/
   # Should respond with 200 OK
   ```

### **Post-Incident**

1. Review what went wrong
2. Create new fix branch
3. Thorough testing before re-deployment
4. Deploy during low-traffic window
5. Extended monitoring period

---

## ⚠️ Known Issues & Workarounds

### Issue: Chat messages not syncing
- **Symptom:** New messages appear after page refresh
- **Cause:** Realtime subscription not established
- **Fix:** Add exponential backoff for WebSocket reconnection

### Issue: Payment processing slow
- **Symptom:** Payment page takes > 5 seconds
- **Cause:** Flouci API latency
- **Workaround:** Display loading indicator, implement retry logic

### Issue: High database load
- **Symptom:** Response times > 1 second
- **Cause:** Inefficient queries or high concurrent load
- **Fix:** Enable query result caching, add database indexes

---

## 📞 Emergency Contacts

Create an incident response team:

```
Technical Lead: [name] - [phone]
Database Admin: [name] - [phone]
DevOps Lead: [name] - [phone]
Product Manager: [name] - [phone]
On-Call Rotation: [Slack channel or PagerDuty link]
```

---

## ✨ Success Criteria

Production deployment is successful when:

✅ Application up and responsive  
✅ Zero critical errors in logs  
✅ Error rate < 0.5%  
✅ Response time < 500ms (P95)  
✅ All user journeys working (auth, jobs, proposals, contracts, payments)  
✅ Real-time features working (chat < 1s latency)  
✅ File uploads successful  
✅ Payments processing successfully  
✅ No RLS policy violations in logs  
✅ Performance metrics within SLA  
✅ No unusual spike in error reports  

---

## 🎉 Production Deployment Complete

When all criteria met:

1. Send "All Clear" message to team
2. Update status page
3. Schedule post-deployment retrospective
4. Document lessons learned
5. Update runbooks with any new procedures

---

## 📚 Related Documentation

- [DEPLOYMENT_GUIDE_STAGING.md](DEPLOYMENT_GUIDE_STAGING.md) - Staging deployment
- [PHASE6_E2E.md](PHASE6_E2E.md) - E2E testing checklist
- [RLS_AUDIT_SUMMARY.txt](RLS_AUDIT_SUMMARY.txt) - Security audit results
- [PHASE5_MASTERY_GUIDE.md](PHASE5_MASTERY_GUIDE.md) - Feature implementation details

**Contact:** deployment-team@khedma.tn  
**Last Tested:** [date]  
**Next Review:** [date + 30 days]
