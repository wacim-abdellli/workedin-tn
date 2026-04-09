# Khedmetna Staging Deployment Guide

**Last Updated:** March 31, 2026  
**Status:** Ready for Implementation  
**Estimated Duration:** 30-45 minutes  

---

## 🎯 Pre-Deployment Checklist

Before deploying to staging, ensure:

- [ ] All code changes committed to main branch
- [ ] All tests passing: `npm run test:run`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No ESLint warnings: `npm run lint`
- [ ] RLS policies verified in production Supabase
- [ ] Environment variables prepared for staging

---

## 📋 Staging Environment Setup

### 1. **Configure Staging Environment Variables**

Create `.env.staging` or update your deployment platform (Vercel/Netlify):

```env
# Supabase Staging
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Sentry (optional)
VITE_SENTRY_DSN=your-sentry-dsn
```

> ⚠️ **Email and payment credentials are server-side secrets only.**
> Do NOT add `VITE_SENDGRID_*`, `VITE_FLOUCI_*`, or `VITE_RESEND_*` variables.
> Set these via Supabase CLI against the staging project ref:
> ```bash
> supabase secrets set RESEND_API_KEY=your-staging-resend-key --project-ref <staging-ref>
> supabase secrets set FLOUCI_APP_TOKEN=your-flouci-test-token --project-ref <staging-ref>
> supabase secrets set FLOUCI_APP_SECRET=your-flouci-test-secret --project-ref <staging-ref>
> ```
> The Flouci Edge Function uses its own test/production mode internally — no `VITE_FLOUCI_TEST_MODE` is needed.

### 2. **Database Migration**

Before first staging deployment:

```bash
# Connect to staging Supabase project
# Run all migrations in order:
supabase db push  # or manually execute migrations from supabase/migrations/

# Verify RLS policies
psql -U postgres \
  -h your-staging-db.supabase.co \
  -d postgres \
  -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

# Expected output: All tables should have rowsecurity = true
```

### 3. **Seed Test Data (Optional)**

```bash
# Add test users and data for QA
supabase db seed --file supabase/seed.sql

# Or run migration with test data:
psql -U postgres \
  -h your-staging-db.supabase.co \
  -d postgres \
  -f supabase/seed.sql
```

---

## 🚀 Deployment Steps

### **Option A: Vercel Deployment** (Recommended)

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Configure Staging Environment**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.staging`
   - Create new "Staging" environment

3. **Deploy to Staging**
   ```bash
   vercel deploy --prod --env staging
   # Or use Vercel Dashboard → Deploy
   ```

4. **Verify Deployment**
   - Check build logs for errors
   - Visit staging URL
   - Verify real-time features work (Supabase connection)

### **Option B: Docker/Kubernetes**

1. **Build Docker Image**
   ```bash
   docker build -f Dockerfile.staging -t khedma-staging:latest .
   docker tag khedma-staging:latest your-registry/khedma-staging:latest
   docker push your-registry/khedma-staging:latest
   ```

2. **Deploy to Kubernetes**
   ```bash
   kubectl apply -f k8s/staging-deployment.yaml
   kubectl rollout status deployment/khedma-staging
   ```

3. **Check Deployment Status**
   ```bash
   kubectl get pods -l app=khedma-staging
   kubectl logs -f deployment/khedma-staging
   ```

### **Option C: Manual VPS Deployment**

1. **SSH into Staging Server**
   ```bash
   ssh deploy@staging.khedmetna.tn
   cd /var/www/khedma-staging
   ```

2. **Pull Latest Code**
   ```bash
   git pull origin main
   npm ci  # Clean install
   npm run build
   ```

3. **Start Application**
   ```bash
   pm2 start "npm run preview" --name "khedma-staging"
   pm2 save
   ```

---

## ✅ Post-Deployment Verification

### 1. **Health Checks**

```bash
# Check if app is responding
curl https://staging.khedmetna.tn/

# Check API connectivity
curl https://staging.khedmetna.tn/api/health

# Verify Supabase connection
# (Log in to app and check browser console for errors)
```

### 2. **Core Functionality Tests**

- [ ] User registration works (both Client and Freelancer)
- [ ] Login with email/password
- [ ] OAuth login (if configured)
- [ ] Dashboard loads without errors
- [ ] Job board displays jobs
- [ ] Can create new job (client)
- [ ] Can submit proposal (freelancer)
- [ ] Chat/messaging works in real-time
- [ ] File upload works
- [ ] Payment flow initiates (test mode)

### 3. **Security Verification**

- [ ] HTTPS/TLS working
- [ ] Content Security Policy (CSP) headers present
- [ ] RLS policies blocking unauthorized access
- [ ] Session tokens valid
- [ ] No secrets in console logs

### 4. **Performance Baseline**

Use Chrome DevTools or Lighthouse:

```bash
npm run build
lighthouse https://staging.khedmetna.tn --view

# Should show:
# - Performance: > 80
# - Accessibility: > 90
# - Best Practices: > 85
# - SEO: > 90
```

### 5. **Monitor Logs**

```bash
# Real-time logs
tail -f /var/log/khedma/staging.log

# Error logs
grep ERROR /var/log/khedma/staging.log | tail -20

# Database connection logs
tail -f /var/log/khedma/db.log
```

---

## 🔄 Continuous Monitoring

### 1. **Set Up Alert Rules**

Configure alerts for:
- [ ] High error rate (> 5% of requests)
- [ ] Response time > 3 seconds
- [ ] Database connection failures
- [ ] Memory usage > 80%
- [ ] Disk space < 10%

### 2. **Daily Checks (First Week)**

Run daily for first 7 days:

```bash
# Check application status
curl -I https://staging.khedmetna.tn/

# Check error logs
grep "ERROR\|FATAL" /var/log/khedma/staging.log | wc -l

# Check performance metrics
curl https://staging.khedmetna.tn/metrics | jq '.http_requests_total'
```

### 3. **Weekly Health Report**

Send weekly report including:
- Uptime percentage
- Error rate
- Average response time
- Top errors
- Resource usage trends

---

## 🧪 QA Validation Period

### Phase 1: Developer Testing (1 Day)
- Internal team tests all critical paths
- Check for regressions
- Verify new features work

### Phase 2: QA Testing (2-3 Days)
- Comprehensive feature testing
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing (iOS, Android)
- Accessibility testing

### Phase 3: Performance Testing (1 Day)
- Load testing with 100+ concurrent users
- Database query performance
- Real-time feature stability

### Phase 4: Security Testing (1 Day)
- OWASP Top 10 scan
- SQL injection attempts
- XSS vulnerability testing
- Authorization bypass attempts

---

## 🔧 Rollback Procedure

If issues are discovered:

### **Quick Rollback (< 5 minutes)**

```bash
# Revert to previous version
vercel rollback  # Vercel-specific

# Or re-deploy previous commit
git revert HEAD
npm run build
npm run deploy
```

### **Manual Rollback**

```bash
# SSH into server
ssh deploy@staging.khedmetna.tn

# Stop current version
pm2 stop khedma-staging

# Checkout previous version
git checkout previous-stable-commit
npm ci
npm run build

# Start with previous version
pm2 start "npm run preview" --name "khedma-staging"

# Verify health
curl https://staging.khedmetna.tn/
```

### **Database Rollback**

If database migrations caused issues:

```bash
# List backups
supabase db list-backups --project-id your-staging-project

# Restore from backup
supabase db restore --project-id your-staging-project --backup-id backup_id
```

---

## 📊 Success Criteria

Staging deployment is successful when:

✅ Application loads without errors  
✅ All core features working (auth, jobs, proposals, contracts, chat)  
✅ Real-time features (chat, notifications) responding < 1s  
✅ No 500 errors in logs  
✅ Performance metrics within targets (FCP < 1.5s, TTI < 3s)  
✅ All security checks pass  
✅ QA team approves for production  

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: White page, no content**
- Solution: Check browser console for JavaScript errors
- Check Network tab for failed API requests
- Verify Supabase connection variables

**Issue: Supabase connection errors**
- Solution: Verify environment variables match staging Supabase project
- Check Supabase project status
- Review RLS policies aren't blocking requests

**Issue: Slow page load**
- Solution: Check Performance tab in DevTools
- Verify API response times (should be < 500ms)
- Check database query performance

**Issue: Real-time features not updating**
- Solution: Verify Realtime is enabled in Supabase
- Check browser console for WebSocket errors
- Restart Realtime feature in Supabase

---

## ✨ Deployment Checklist (Final)

Before considering staging deployment complete:

- [ ] Build succeeds without warnings
- [ ] All tests passing
- [ ] App loads in browser
- [ ] Auth system working
- [ ] Database connected and responding
- [ ] Real-time features working
- [ ] Chat/messaging working
- [ ] File uploads working
- [ ] Payment flow initiates
- [ ] No console errors
- [ ] Performance metrics good (Lighthouse > 80)
- [ ] Security checks pass
- [ ] QA team sign-off received

---

**Next Steps:** After 2-3 days of successful staging validation, proceed to production deployment (see DEPLOYMENT_GUIDE_PRODUCTION.md)
